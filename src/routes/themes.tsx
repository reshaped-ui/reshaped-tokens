import * as React from "react";
import { View, Link, Text, Avatar } from "reshaped";
import EmptyState from "components/EmptyState";
import Theme from "components/Theme";
import Layout from "components/Layout";
import IconSun from "icons/Sun";
import IconSync from "icons/Sync";
import * as ThemeService from "services/theme";
import * as G from "types/global";

type Props = {
	themes: Record<G.Theme["id"], G.Theme>;
	onCreateClick: () => void;
	onThemeEditClick: (theme: G.Theme) => void;
};

const ThemesRoute = (props: Props) => {
	const { themes, onCreateClick, onThemeEditClick } = props;
	const [selectedTab, setSelectedTab] = React.useState<"themes" | "about">("themes");
	const [selectedThemeId, setSelectedThemeId] = React.useState<string | null>(null);
	const selectedTheme = selectedThemeId && themes[selectedThemeId];
	const canApplyTheme = selectedTheme && selectedTheme.data;
	const ids = Object.keys(themes);
	const hasThemes = ids.length > 0;

	const handleThemeClick = (theme?: G.Theme) => {
		if (!theme) return;
		const isSelected = selectedThemeId === theme.id;

		setSelectedThemeId(isSelected ? null : theme.id);
	};

	const handleApply = () => {
		if (!selectedTheme) return;
		const { data } = selectedTheme;

		if (!data) return;
		ThemeService.plugin.requestApplyTheme({ styles: data.styles, variables: data.variables });
	};

	const aboutSlot = selectedTab === "about" && (
		<View padding={2} align="center" justify="center">
			<div>
				Built with{" "}
				<Link attributes={{ target: "_blank" }} href="https://reshaped.so" color="primary">
					Reshaped
				</Link>{" "}
				in Amsterdam ❤️
			</div>
		</View>
	);

	return (
		<Layout
			centered={!hasThemes && selectedTab === "themes"}
			onClick={() => setSelectedThemeId(null)}
			tabs={[
				{
					text: "Themes",
					onClick: () => setSelectedTab("themes"),
					selected: selectedTab === "themes",
				},
				{
					text: "About",
					onClick: () => setSelectedTab("about"),
					selected: selectedTab === "about",
				},
			]}
			action={
				selectedTab === "themes" && hasThemes
					? {
							text: "Reshape",
							onClick: handleApply,
							disabled: !canApplyTheme,
					  }
					: undefined
			}
			secondaryActionSlot={selectedTab === "about" && aboutSlot}
		>
			{selectedTab === "themes" && !hasThemes && <EmptyState onCreateClick={onCreateClick} />}

			{selectedTab === "themes" && hasThemes && (
				<View gap={2}>
					{ids.map((id) => (
						<Theme
							data={themes[id]}
							onEditClick={onThemeEditClick}
							onClick={handleThemeClick}
							selected={selectedThemeId === themes[id]?.id}
						/>
					))}
					<Theme onClick={onCreateClick} />
				</View>
			)}

			{selectedTab === "about" && (
				<Text variant="body-3">
					<View gap={4}>
						<View.Item as="p">
							Oh, hi <span aria-hidden="true">👋</span> I&apos;m a plugin that can add themes and
							switch to dark mode. I work locally and do it blazingly fast. Here&apos;s how we can
							be friends:
						</View.Item>
						<View direction="row" gap={2}>
							<Avatar icon={IconSun} squared color="neutral" variant="faded" size={8} />
							<View.Item>
								<Text variant="body-3" weight="medium">
									Open me in the theme library
								</Text>
								<Text color="neutral-faded">Make sure your styles are published</Text>
							</View.Item>
						</View>
						<View direction="row" gap={2}>
							<Avatar icon={IconSync} squared color="neutral" variant="faded" size={8} />
							<View.Item>
								<Text variant="body-3" weight="medium">
									Sync styles and save
								</Text>
								<Text color="neutral-faded">Ah, and add your theme name</Text>
							</View.Item>
						</View>
						<View.Item as="p">
							Done, enjoy changing themes!
							<br />
							Just in case, I&apos;ve got&nbsp;
							<Link
								attributes={{ target: "_blank" }}
								href="https://reshaped.so/content/docs/getting-started/figma/plugin"
								color="inherit"
							>
								docs and a demo
							</Link>
							&nbsp;🙌
						</View.Item>
					</View>
				</Text>
			)}
		</Layout>
	);
};

export default ThemesRoute;
