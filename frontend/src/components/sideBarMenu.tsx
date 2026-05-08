import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Dimensions,
  Platform, StatusBar, Animated,
} from 'react-native';
import { FORMS } from '../config/forms';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH     = width * 0.78;

const getFormIcon = (api: string) => {
  const icons: Record<string, string> = {
    eggproduction:   '🥚',
    birdLiveStock:   '🐔',
    eggGodownStock:  '📦',
    eggSaleSummary:  '💰',
    feedConsumption: '🌾',
    feedProduction:  '⚙️',
    feedShedStock:   '🏪',
    feedSupply:      '🚚',
    rawMaterialStock:'📊',
  };
  return icons[api] || '📝';
};

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
};

const SidebarMenu = ({ visible, onClose, navigation }: Props) => {
  const [expanded, setExpanded]   = useState(true);
  const slideAnim                 = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim                  = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  // ── Open animation ────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue:         0,
          duration:        280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue:         1,
          duration:        280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // ── Close animation ──────────────────────────────
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue:         -SIDEBAR_WIDTH,
          duration:        240,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue:         0,
          duration:        240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false); // hide modal after animation
      });
    }
  }, [visible]);

  const navigateToForm = (form: any) => {
    onClose();
    setTimeout(() => {
      navigation.navigate('DynamicForm', {
        title:  form.title,
        fields: form.fields,
        api:    form.api,
      });
    }, 280);
  };

  const navigateHome = () => {
    onClose();
  };

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"          // ← none! we handle animation ourselves
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.root}>

        {/* ── Backdrop with fade ── */}
        <Animated.View
          style={[styles.backdrop, { opacity: fadeAnim }]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* ── Sidebar sliding from left ── */}
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.logo}>🐔 Merla Farms</Text>
              <Text style={styles.subtitle}>Farm Management System</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Menu */}
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Dashboard */}
            <TouchableOpacity style={styles.menuItem} onPress={navigateHome}>
              <Text style={styles.menuIcon}>🏠</Text>
              <Text style={styles.menuText}>Dashboard</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Transactions toggle */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.sectionTitle}>📋 TRANSACTIONS</Text>
              <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Form items */}
            {expanded && FORMS.map((form, index) => (
              <TouchableOpacity
                key={index}
                style={styles.subMenuItem}
                onPress={() => navigateToForm(form)}
              >
                <Text style={styles.subMenuIcon}>{getFormIcon(form.api)}</Text>
                <Text style={styles.subMenuText}>{form.title}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 60 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Merla Farms © 2026</Text>
          </View>
        </Animated.View>

      </View>
    </Modal>
  );
};

export default SidebarMenu;

const styles = StyleSheet.create({
  root: {
    flex:          1,
    flexDirection: 'row',
  },

  // ── Backdrop ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  // ── Sidebar ──
  sidebar: {
    position:        'absolute',
    left:            0,
    top:             0,
    bottom:          0,
    width:           SIDEBAR_WIDTH,
    backgroundColor: '#1e3a5f',
    paddingTop:      Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    elevation:       16,
    shadowColor:     '#000',
    shadowOpacity:   0.3,
    shadowRadius:    12,
    shadowOffset:    { width: 4, height: 0 },
  },

  // ── Header ──
  header: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    padding:           20,
    paddingTop:        16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logo:     { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  closeBtn: { padding: 4, marginLeft: 8 },
  closeText:{ color: '#fff', fontSize: 20, fontWeight: '300' },

  scroll: { flex: 1, paddingTop: 8 },

  // ── Dashboard item ──
  menuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    padding:           14,
    paddingHorizontal: 20,
    marginHorizontal:  8,
    borderRadius:      10,
  },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // ── Divider ──
  divider: {
    height:           1,
    backgroundColor:  'rgba(255,255,255,0.1)',
    marginVertical:   8,
    marginHorizontal: 16,
  },

  // ── Section toggle ──
  sectionHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   10,
  },
  sectionTitle: {
    fontSize:      11,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
  },
  chevron: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  // ── Form items ──
  subMenuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   12,
    paddingHorizontal: 20,
    marginHorizontal:  8,
    borderRadius:      10,
  },
  subMenuIcon: { fontSize: 16, marginRight: 12, width: 24 },
  subMenuText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // ── Footer ──
  footer: {
    padding:         16,
    borderTopWidth:  1,
    borderTopColor:  'rgba(255,255,255,0.1)',
    alignItems:      'center',
  },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
});