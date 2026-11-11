import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stars } from "./Stars";
import { AvatarPlaceholder } from "./ui";
import { Review, formatReviewMonth } from "../services/reviews";
import { colors, spacing } from "../styles/theme";

// Una reseña: foto y nombre de quien la escribió, estrellas, fecha y comentario.
export function ReviewItem({ review: review }: { review: Review }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AvatarPlaceholder size={32} source={review.author.photo} />
        <View>
          <Text style={styles.name}>{review.author.name}</Text>
          <View style={styles.line}>
            <Stars value={review.stars} size={11} />
            <Text style={styles.date}>· {formatReviewMonth(review.date)}</Text>
          </View>
        </View>
      </View>
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: colors.textLight,
  },
  comment: {
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});