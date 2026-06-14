import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../context/ThemeContext";
import { DocumentRecord } from "../../../types/car";
import {
  formatDate,
  getDocumentConfig,
  getFileExtension,
} from "../../../utils/document";

type Props = {
  document: DocumentRecord;
  onPress: () => void;
  disabled?: boolean;
};

export function DocumentItem({ document, onPress, disabled }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const config = getDocumentConfig(document.type, theme.activeMode);

  const subtitle = document.expiresAt
    ? `${t("cars.validUntil")} ${formatDate(document.expiresAt)}`
    : `${t("cars.addedOn")} ${formatDate(document.createdAt)}`;

  return (
    <TouchableOpacity
      style={[
        styles.documentCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: disabled ? 0.65 : 1,
        },
      ]}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={styles.documentLeft}>
        <View style={[styles.documentIconBox, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.documentTitle, { color: theme.text }]}>
            {t(`documentTypes.${document.type}`)}
          </Text>

          <Text style={[styles.documentSubtitle, { color: theme.mutedText }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.documentRight}>
        {document.fileUrl ? (
          <Text style={[styles.documentType, { color: theme.text }]}>
            {getFileExtension(document.fileUrl)}
          </Text>
        ) : null}

        <TouchableOpacity onPress={(e) => e.stopPropagation()}>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={theme.mutedText}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  documentCard: {
    minHeight: 78,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  documentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  documentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  documentSubtitle: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
  },
  documentRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  documentType: {
    fontSize: 13,
    fontWeight: "900",
  },
});