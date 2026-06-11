import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../../context/ThemeContext";
import { DocumentRecord } from "../../../types/car";
import { getFileExtension } from "../../../utils/document";
import { DocumentPreview } from "./DocumentPreview";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  document: DocumentRecord | null;
  onClose: () => void;
};

export function DocumentPreviewModal({ document, onClose }: Props) {
  const { theme } = useAppTheme();

  return (
    <Modal
      visible={!!document}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.modalContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.modalHeader,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[styles.modalTitle, { color: theme.text }]}
            >
              {document?.title}
            </Text>

            {document ? (
              <Text
                numberOfLines={1}
                style={[styles.modalSubtitle, { color: theme.mutedText }]}
              >
                {getFileExtension(document.fileUrl)}
              </Text>
            ) : null}
          </View>

          <Pressable style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
        </View>

        {document ? <DocumentPreview document={document} /> : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },
  modalCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});