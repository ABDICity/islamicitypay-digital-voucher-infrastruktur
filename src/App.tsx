import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TwoFactorModal } from './components/TwoFactorModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { VoucherDetailModal } from './components/VoucherDetailModal';
import { IssueVoucherModal } from './components/IssueVoucherModal';
import { RedeemVoucherModal } from './components/RedeemVoucherModal';
import { ExportReportModal } from './components/ExportReportModal';
import { VisualWebsiteEditorModal } from './components/modals/VisualWebsiteEditorModal';

// Tab Views
import { DashboardTab } from './components/tabs/DashboardTab';
import { ContentManagementTab } from './components/tabs/ContentManagementTab';
import { VouchersTab } from './components/tabs/VouchersTab';
import { SecurityTab } from './components/tabs/SecurityTab';
import { BankingApiTab } from './components/tabs/BankingApiTab';
import { AuditLogTab } from './components/tabs/AuditLogTab';
import { MobileWalletTab } from './components/tabs/MobileWalletTab';
import { AiAdvisorTab } from './components/tabs/AiAdvisorTab';
import { SettingsTab } from './components/tabs/SettingsTab';

import { 
  Voucher, 
  Transaction, 
  AuditLog, 
  PushNotification, 
  SecurityStatus, 
  NavigationTab 
} from './types';
import { 
  initialVouchers, 
  initialTransactions, 
  initialAuditLogs, 
  initialNotifications, 
  initialSecurityStatus 
} from './utils/mockData';
import { sounds } from './utils/soundEffects';

export default function App() {
  // Theme & Language State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentLang, setCurrentLang] = useState<'id' | 'en' | 'ar'>('id');

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Core Business Ledger State
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [notifications, setNotifications] = useState<PushNotification[]>(initialNotifications);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>(initialSecurityStatus);

  // Modal Control State
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isWebsiteEditorOpen, setIsWebsiteEditorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<Voucher | null>(null);
  const [selectedVoucherForRedeem, setSelectedVoucherForRedeem] = useState<Voucher | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync Dark Mode class with HTML document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync RTL for Arabic language
  useEffect(() => {
    if (currentLang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [currentLang]);

  // Handle Voucher Issuance
  const handleIssueVoucher = (newVoucher: Voucher) => {
    setVouchers(prev => [newVoucher, ...prev]);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      category: 'TRANSACTION',
      action: `Penerbitan Voucher Syariah: ${newVoucher.code} (${newVoucher.title})`,
      actor: 'Admin Lazis / Sharia Officer',
      role: 'Super Admin',
      ipAddress: '103.144.172.58',
      severity: 'AUDIT_SEALED',
      payloadHash: newVoucher.encryptedHash,
      notes: `Voucher senilai Rp ${newVoucher.faceValue.toLocaleString('id-ID')} diterbitkan dengan akad ${newVoucher.shariaContract}.`,
      dsnMuiCompliance: true,
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Create Notification
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: 'Voucher Baru Diterbitkan',
      message: `Voucher ${newVoucher.code} (${newVoucher.title}) berhasil diterbitkan dan disegel digital.`,
      timestamp: 'Baru saja',
      type: 'TRANSACTION',
      read: false,
      voucherCode: newVoucher.code,
      amount: newVoucher.faceValue,
    };
    setNotifications(prev => [newNotif, ...prev]);
    sounds.playNotification();
  };

  // Handle Voucher Redemption
  const handleRedeemSuccess = (transaction: Transaction, updatedVoucher: Voucher) => {
    // Update voucher in list
    setVouchers(prev => prev.map(v => v.id === updatedVoucher.id ? updatedVoucher : v));
    // Prepend transaction
    setTransactions(prev => [transaction, ...prev]);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: transaction.timestamp,
      category: 'TRANSACTION',
      action: `Penebusan Voucher: ${transaction.voucherCode} sebesar Rp ${transaction.amount.toLocaleString('id-ID')}`,
      actor: transaction.merchantName,
      role: 'Merchant POS',
      ipAddress: transaction.ipAddress || '103.144.172.58',
      severity: 'AUDIT_SEALED',
      payloadHash: transaction.endToEndHash,
      notes: `Penyelesaian real-time via ${transaction.bankChannel} (Audit ID: ${transaction.shariaAuditId}).`,
      dsnMuiCompliance: true,
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Notification
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: 'Penebusan Voucher Berhasil',
      message: `Voucher ${transaction.voucherCode} senilai Rp ${transaction.amount.toLocaleString('id-ID')} berhasil ditebus di ${transaction.merchantName}.`,
      timestamp: 'Baru saja',
      type: 'TRANSACTION',
      read: false,
      voucherCode: transaction.voucherCode,
      amount: transaction.amount,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Notification actions
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    sounds.playClick();
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
    sounds.playClick();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0A0A0B] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Top Main Navigation Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        securityStatus={securityStatus}
        onOpen2FaModal={() => {
          sounds.playClick();
          setIs2FaModalOpen(true);
        }}
        notifications={notifications}
        onOpenNotifications={() => {
          sounds.playClick();
          setIsNotificationOpen(true);
        }}
        onOpenIssueModal={() => {
          sounds.playClick();
          setIsIssueModalOpen(true);
        }}
        onOpenRedeemModal={() => {
          sounds.playClick();
          setSelectedVoucherForRedeem(null);
          setIsRedeemModalOpen(true);
        }}
        onOpenWebsiteEditor={() => {
          sounds.playClick();
          setIsWebsiteEditorOpen(true);
        }}
      />

      {/* Main Body Layout with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            sounds.playClick();
            setActiveTab(tab);
          }}
          currentLang={currentLang}
          activeVoucherCount={vouchers.filter(v => v.status === 'ACTIVE').length}
          auditLogCount={auditLogs.length}
          onOpenWebsiteEditor={() => {
            sounds.playClick();
            setIsWebsiteEditorOpen(true);
          }}
        />

        {/* Tab Content Render Area */}
        <main className="flex-1 min-w-0">
          
          {activeTab === 'dashboard' && (
            <DashboardTab
              currentLang={currentLang}
              vouchers={vouchers}
              transactions={transactions}
              securityStatus={securityStatus}
              onOpenIssueModal={() => setIsIssueModalOpen(true)}
              onOpenRedeemModal={() => {
                setSelectedVoucherForRedeem(null);
                setIsRedeemModalOpen(true);
              }}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onViewVoucherDetails={(v) => setSelectedVoucherForDetail(v)}
            />
          )}

          {activeTab === 'content' && (
            <ContentManagementTab 
              currentLang={currentLang} 
              onOpenWebsiteEditor={() => {
                sounds.playClick();
                setIsWebsiteEditorOpen(true);
              }}
            />
          )}

          {activeTab === 'vouchers' && (
            <VouchersTab
              currentLang={currentLang}
              vouchers={vouchers}
              onOpenIssueModal={() => setIsIssueModalOpen(true)}
              onViewDetails={(v) => setSelectedVoucherForDetail(v)}
              onQuickRedeem={(v) => {
                setSelectedVoucherForRedeem(v);
                setIsRedeemModalOpen(true);
              }}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              currentLang={currentLang}
              securityStatus={securityStatus}
              onUpdateSecurityStatus={(updated) => setSecurityStatus(prev => ({ ...prev, ...updated }))}
              onOpen2FaModal={() => setIs2FaModalOpen(true)}
            />
          )}

          {activeTab === 'banking_api' && (
            <BankingApiTab currentLang={currentLang} />
          )}

          {activeTab === 'audit_log' && (
            <AuditLogTab
              currentLang={currentLang}
              auditLogs={auditLogs}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {activeTab === 'mobile_wallet' && (
            <MobileWalletTab
              currentLang={currentLang}
              vouchers={vouchers}
              transactions={transactions}
              onOpenRedeemModal={(v) => {
                setSelectedVoucherForRedeem(v || null);
                setIsRedeemModalOpen(true);
              }}
              onViewDetails={(v) => setSelectedVoucherForDetail(v)}
            />
          )}

          {activeTab === 'ai_advisor' && (
            <AiAdvisorTab
              currentLang={currentLang}
              vouchers={vouchers}
              transactions={transactions}
              onUpdateVoucher={(updated) => setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v))}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              currentLang={currentLang}
              onLanguageChange={setCurrentLang}
            />
          )}

        </main>

      </div>

      {/* Global Modals */}

      {/* 2FA Security Modal */}
      <TwoFactorModal
        isOpen={is2FaModalOpen}
        onClose={() => setIs2FaModalOpen(false)}
        currentLang={currentLang}
        securityStatus={securityStatus}
        onToggle2Fa={(enabled) => {
          setSecurityStatus(prev => ({ ...prev, twoFactorEnabled: enabled }));
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAllAllNotifs => handleClearAllNotifs()}
        onSelectNotification={(notif) => {
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        }}
      />

      {/* Voucher Detail Modal */}
      <VoucherDetailModal
        voucher={selectedVoucherForDetail}
        isOpen={!!selectedVoucherForDetail}
        onClose={() => setSelectedVoucherForDetail(null)}
        currentLang={currentLang}
        onRedeemClick={(v) => {
          setSelectedVoucherForDetail(null);
          setSelectedVoucherForRedeem(v);
          setIsRedeemModalOpen(true);
        }}
      />

      {/* Issue Voucher Modal */}
      <IssueVoucherModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        currentLang={currentLang}
        onIssueVoucher={handleIssueVoucher}
      />

      {/* Redeem Voucher Modal */}
      <RedeemVoucherModal
        voucher={selectedVoucherForRedeem}
        isOpen={isRedeemModalOpen}
        onClose={() => {
          setIsRedeemModalOpen(false);
          setSelectedVoucherForRedeem(null);
        }}
        currentLang={currentLang}
        securityStatus={securityStatus}
        allVouchers={vouchers}
        onRedeemSuccess={handleRedeemSuccess}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentLang={currentLang}
        vouchers={vouchers}
        transactions={transactions}
        auditLogs={auditLogs}
      />

      {/* Visual Drag & Drop Website Editor Modal */}
      <VisualWebsiteEditorModal
        isOpen={isWebsiteEditorOpen}
        onClose={() => setIsWebsiteEditorOpen(false)}
        currentLang={currentLang}
        onSaveToast={(msg) => showToast(msg)}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900/95 dark:bg-emerald-950/90 text-white border border-emerald-500/40 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in text-xs font-semibold max-w-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

    </div>
  );
}
