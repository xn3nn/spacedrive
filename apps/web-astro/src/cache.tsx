import { createContext, useContext, type ParentProps } from 'solid-js';
import { createStore, type SetStoreFunction, type Store } from 'solid-js/store';

export type CacheNode = {
	__type: string;
	__id: string;
} & Record<string, unknown>;

export const cacheCtx = createContext<Cache>();

export type UseCacheResult<T> = T extends (infer A)[]
	? UseCacheResult<A>[]
	: T extends object
	? T extends { '__type': any; '__id': string; '#type': infer U }
		? UseCacheResult<U>
		: { [K in keyof T]: UseCacheResult<T[K]> }
	: { [K in keyof T]: UseCacheResult<T[K]> };

function constructCache(nodes: Store<Nodes>, setNodes: SetStoreFunction<Nodes>) {
	return {
		getNodes: () => nodes,
		getNode: (type: string, id: string) => nodes?.[type]?.[id] as unknown | undefined,
		setNodes: (newNodes: CacheNode | CacheNode[]) => {
			if (!Array.isArray(newNodes)) newNodes = [newNodes];

			for (const node of newNodes) {
				if (!(typeof node === 'object' || '__type' in node || '__id' in node))
					throw new Error(
						`Tried to 'setNodes' but encountered invalid node '${JSON.stringify(node)}'`
					);

				const { __type, __id, ...copy } = { ...node } as any;

				if (!nodes[node.__type]) setNodes(node.__type, {});
				setNodes(node.__type, node.__id, copy); // Be aware this is a merge, not a replace
			}
		},
		useCache<T>(item: T) {
			return restore(nodes, item) as UseCacheResult<T>;
		}
	};
}

export type Cache = ReturnType<typeof constructCache>;
export type Nodes = Record<string, Record<string, unknown>>;

export function createCache() {
	const [nodes, setNodes] = createStore({} as Nodes);
	const cache = constructCache(nodes, setNodes);

	return {
		...cache,
		Provider: (props: ParentProps) => (
			<cacheCtx.Provider value={cache}>{props.children}</cacheCtx.Provider>
		)
	};
}

export function useCache() {
	const c = useContext(cacheCtx);
	if (!c) throw new Error('Did you forget to mount `cache.Provider`?');
	return c;
}

function restore(nodes: Store<Nodes>, item: unknown): unknown {
	if (item === undefined || item === null) {
		return item;
	} else if (Array.isArray(item)) {
		return item.map((v) => restore(nodes, v));
	} else if (typeof item === 'object') {
		if ('__type' in item && '__id' in item) {
			if (typeof item.__type !== 'string') throw new Error('Invalid `__type`');
			if (typeof item.__id !== 'string') throw new Error('Invalid `__id`');
			const result = nodes?.[item.__type]?.[item.__id];
			if (!result)
				throw new Error(`Missing node for id '${item.__id}' of type '${item.__type}'`);
			return result;
		}

		return Object.fromEntries(
			Object.entries(item).map(([key, value]) => [key, restore(nodes, value)])
		);
	}

	return item;
}
