import { CompositeScreenProps } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import Header from '~/components/header/Header';
import AppearanceSettingsScreen from '~/screens/settings/client/AppearanceSettings';
import ExtensionsSettingsScreen from '~/screens/settings/client/ExtensionsSettings';
import GeneralSettingsScreen from '~/screens/settings/client/GeneralSettings';
import LibrarySettingsScreen from '~/screens/settings/client/LibrarySettings';
import PrivacySettingsScreen from '~/screens/settings/client/PrivacySettings';
import AboutScreen from '~/screens/settings/info/About';
import DebugScreen from '~/screens/settings/info/Debug';
import SupportScreen from '~/screens/settings/info/Support';
import EditLocationSettingsScreen from '~/screens/settings/library/EditLocationSettings';
import LibraryGeneralSettingsScreen from '~/screens/settings/library/LibraryGeneralSettings';
import LocationSettingsScreen from '~/screens/settings/library/LocationSettings';
import NodesSettingsScreen from '~/screens/settings/library/NodesSettings';
import TagsSettingsScreen from '~/screens/settings/library/TagsSettings';
import SettingsScreen from '~/screens/settings/Settings';

// import KeysSettingsScreen from '~/screens/settings/library/KeysSettings';

import { TabScreenProps } from '../TabNavigator';

const Stack = createStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
	return (
		<Stack.Navigator initialRouteName="Settings">
			<Stack.Screen
				name="Settings"
				component={SettingsScreen}
				options={{ header: () => <Header title="Settings" /> }}
			/>
			{/* Client */}
			<Stack.Screen
				name="GeneralSettings"
				component={GeneralSettingsScreen}
				options={{ header: () => <Header navBack title="General" /> }}
			/>
			<Stack.Screen
				name="LibrarySettings"
				component={LibrarySettingsScreen}
				options={{ header: () => <Header navBack title="Libraries" /> }}
			/>
			<Stack.Screen
				name="AppearanceSettings"
				component={AppearanceSettingsScreen}
				options={{ header: () => <Header navBack title="Appearance" /> }}
			/>
			<Stack.Screen
				name="PrivacySettings"
				component={PrivacySettingsScreen}
				options={{ header: () => <Header navBack title="Privacy" /> }}
			/>
			<Stack.Screen
				name="ExtensionsSettings"
				component={ExtensionsSettingsScreen}
				options={{ header: () => <Header navBack title="Extensions" /> }}
			/>
			{/* Library */}
			<Stack.Screen
				name="LibraryGeneralSettings"
				component={LibraryGeneralSettingsScreen}
				options={{ header: () => <Header navBack title="Library Settings" /> }}
			/>
			<Stack.Screen
				name="LocationSettings"
				component={LocationSettingsScreen}
				options={{
					header: () => <Header searchType="location" navBack title="Locations" />
				}}
			/>
			<Stack.Screen
				name="EditLocationSettings"
				component={EditLocationSettingsScreen}
				options={{ header: () => <Header navBack title="Edit Location" /> }}
			/>
			<Stack.Screen
				name="NodesSettings"
				component={NodesSettingsScreen}
				options={{ header: () => <Header navBack title="Nodes" /> }}
			/>
			<Stack.Screen
				name="TagsSettings"
				component={TagsSettingsScreen}
				options={{ header: () => <Header navBack title="Tags" /> }}
			/>
			{/* <Stack.Screen
				name="KeysSettings"
				component={KeysSettingsScreen}
				options={{ headerTitle: 'Keys' }}
			/> */}
			{/* Info */}
			<Stack.Screen
				name="About"
				component={AboutScreen}
				options={{ header: () => <Header navBack title="About" /> }}
			/>
			<Stack.Screen
				name="Support"
				component={SupportScreen}
				options={{ header: () => <Header navBack title="Support" /> }}
			/>
			<Stack.Screen
				name="Debug"
				component={DebugScreen}
				options={{ header: () => <Header navBack title="Debug" /> }}
			/>
		</Stack.Navigator>
	);
}

export type SettingsStackParamList = {
	// Home screen for the Settings stack.
	Settings: undefined;
	// Client
	GeneralSettings: undefined;
	LibrarySettings: undefined;
	AppearanceSettings: undefined;
	PrivacySettings: undefined;
	ExtensionsSettings: undefined;
	// Library
	LibraryGeneralSettings: undefined;

	// Location
	LocationSettings: undefined;
	EditLocationSettings: { id: number };

	NodesSettings: undefined;
	TagsSettings: undefined;
	KeysSettings: undefined;
	// Info
	About: undefined;
	Support: undefined;
	Debug: undefined;
};

export type SettingsStackScreenProps<Screen extends keyof SettingsStackParamList> =
	CompositeScreenProps<
		StackScreenProps<SettingsStackParamList, Screen>,
		TabScreenProps<'SettingsStack'>
	>;
