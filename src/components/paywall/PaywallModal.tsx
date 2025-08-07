import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { PaywallScreen } from './PaywallScreen';

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPurchaseCompleted: () => void;
  requiredEntitlement?: string;
  offering?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onDismiss,
  onPurchaseCompleted,
  requiredEntitlement = 'pro',
  offering,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <PaywallScreen
        onDismiss={onDismiss}
        onPurchaseCompleted={onPurchaseCompleted}
        requiredEntitlement={requiredEntitlement}
        offering={offering}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  // No additional styles needed as PaywallScreen handles all styling
});