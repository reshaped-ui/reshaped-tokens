export type Props = {
	onChange: (args: { value: string }) => void;
	value: string | null;
};

export type ColorProps = {
	onClick: (color: string) => void;
	color: string;
	active: boolean;
};
