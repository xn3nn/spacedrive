/*
 * This file exports a object which contains Different Kinds of Icons.
 */
import { Component, ComponentProps } from 'solid-js';

import * as Code from './Code';
import * as Extras from './Extras';

export const LayeredIcons: Partial<
	Record<string, Record<string, Component<ComponentProps<'svg'>>>>
> = { Code, Extras };
