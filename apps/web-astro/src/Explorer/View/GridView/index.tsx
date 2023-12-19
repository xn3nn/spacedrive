import Grid from '../Grid';
import { GridViewItem } from './Item';

export const GridView = () => {
	return (
		<Grid>
			{(props) => (
				<GridViewItem data={props.item} selected={props.selected} cut={props.cut} />
			)}
		</Grid>
	);
};
