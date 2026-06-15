import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { CarDetail, DocumentRecord } from "../../../types/car";
import { DocumentItem } from "./DocumentItem";

type Props = {
  documents?: DocumentRecord[];
  onSelectDocument: (document: DocumentRecord) => void;
  carId: string
};

export function DocumentsTab({ documents = [], onSelectDocument, carId }: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() =>
          router.push({
            pathname: "/vehicles/documents/create",
            params: {
              carId
            },
          })
        }
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>{t("cars.addDocument")}</Text>
      </TouchableOpacity>

      {documents?.length > 0 ? (
        documents.map((document) => (
          <DocumentItem
            key={document.id}
            document={document}
            disabled={!document.fileUrl}
            onPress={() => {
              if (!document.fileUrl) return;
              onSelectDocument(document);
            }}
          />
        ))
      ) : (
        <View
          style={[
            styles.emptyTab,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={{ color: theme.mutedText }}>
            {t("cars.noDocuments")}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
  },
  addButton: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 18,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  emptyTab: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
});
