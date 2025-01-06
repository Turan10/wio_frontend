const StatisticsSection = () => (
  <View style={styles.statsSection}>
    <Text style={styles.statsSectionTitle}>Dashboard Overview</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.statsContainer}
    >
      {MOCK_STATS.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </ScrollView>
  </View>
);

const additionalStyles = StyleSheet.create({
  statsSection: {
    marginVertical: spacing.lg,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statsContainer: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
  },
});
