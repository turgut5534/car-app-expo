import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../../context/ThemeContext";
import { DocumentRecord } from "../../../types/car";
import { getDocumentUrl, getFileExtension } from "../../../utils/document";

type Props = {
  document: DocumentRecord;
};

export function DocumentPreview({ document }: Props) {
  const { theme } = useAppTheme();

  const url = getDocumentUrl(document.fileUrl);
  const extension = getFileExtension(document.fileUrl).toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "webp"].includes(extension);
  const isPdf = extension === "pdf";

  const openExternal = async () => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open document.");
    }
  };

  if (isImage) {
    return (
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: url }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (isPdf) {
    return (
      <WebView
        source={{ uri: url }}
        style={styles.webView}
        startInLoadingState
        renderLoading={() => (
          <View
            style={[
              styles.previewLoading,
              { backgroundColor: theme.background },
            ]}
          >
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        )}
      />
    );
  }

  return (
    <View style={styles.unsupportedPreview}>
      <Ionicons
        name="document-text-outline"
        size={56}
        color={theme.mutedText}
      />

      <Text style={[styles.unsupportedTitle, { color: theme.text }]}>
        Bu dosya türü önizlenemiyor.
      </Text>

      <Text style={[styles.unsupportedText, { color: theme.mutedText }]}>
        Dosyayı cihazdaki uygun uygulama ile açabilirsin.
      </Text>

      <Pressable
        onPress={openExternal}
        style={[styles.openExternalButton, { backgroundColor: theme.primary }]}
      >
        <Text style={styles.openExternalButtonText}>Dosyayı Aç</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  webView: {
    flex: 1,
  },
  previewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  unsupportedPreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  unsupportedTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  unsupportedText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  openExternalButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  openExternalButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
});