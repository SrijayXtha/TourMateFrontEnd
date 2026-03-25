import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// Complete the auth session when this redirect page loads in the popup.
WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });

export default function OAuthRedirect() {
	useEffect(() => {
		WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });
	}, []);

	return (
		<View style={styles.container}>
			<ActivityIndicator size="large" color="#1a73e8" />
			<Text style={styles.title}>Completing sign-in...</Text>
			<Text style={styles.subtitle}>You can close this window if it does not close automatically.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#ffffff",
		paddingHorizontal: 24,
	},
	title: {
		marginTop: 16,
		fontSize: 18,
		fontWeight: "600",
		color: "#1f2937",
	},
	subtitle: {
		marginTop: 8,
		fontSize: 14,
		textAlign: "center",
		color: "#4b5563",
	},
});
