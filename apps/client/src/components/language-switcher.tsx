import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { languages } from '@/i18n';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container} accessibilityLabel={t('language.label')}>
      {languages.map((language) => {
        const selected = i18n.resolvedLanguage === language;
        return (
          <Pressable
            key={language}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => void i18n.changeLanguage(language)}
            style={styles.option}>
            <Text style={selected ? styles.selected : undefined}>{t(`language.${language}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 16 },
  option: { padding: 8 },
  selected: { fontWeight: '600', textDecorationLine: 'underline' },
});
