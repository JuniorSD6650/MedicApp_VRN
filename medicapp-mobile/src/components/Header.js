import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text, Menu } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ title, onLogout }) => {
  const [visible, setVisible] = React.useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleLogout = () => {
    closeMenu();
    if (onLogout) onLogout();
  };

  return (
    <Appbar.Header style={styles.header}>
      <View style={styles.titleContainer}>
        <Ionicons name="medkit" size={24} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Appbar.Action 
            icon="dots-vertical" 
            color="#FFFFFF" 
            onPress={openMenu} 
          />
        }
      >
        <Menu.Item 
          onPress={handleLogout} 
          title="Cerrar Sesión" 
          leadingIcon="logout"
        />
      </Menu>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2196F3',
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Header;
