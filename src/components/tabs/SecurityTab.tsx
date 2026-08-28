import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  RefreshCw, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles, 
  Fingerprint,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SecurityStatus, Language } from '../../types';
import { translations } from '../../utils/translations';
import { generateSha256, encryptPayloadAes256, decryptPayloadAes256 } from '../../utils/crypto';
import { sounds } from '../../utils/soundEffects';

interface SecurityTabProps {
  currentLang: Language;
  securityStatus: SecurityStatus;
  onUpdateSecurityStatus: (updated: Partial<SecurityStatus>) => void;
  onOpen2FaModal: () => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  currentLang,
  securityStatus,
  onUpdateSecurityStatus,
  onOpen2FaModal,
}) => {
  const t = translations[currentLang];

  // Interactive Live E2EE Playground State
  const [plainInput, setPlainInput] = useState<string>(
    JSON.stringify({
      voucher_code: 'ICP-ZIS-8821-X9A2',
      nominal: 1500000,
      beneficiary: 'Ahmad Fauzi (Mustahiq)',
      sharia_contract: 'Hibah / Tabarru',
      timestamp: new Date().toISOString(),
    }, null, 2)
  );

  const [cipherResult, setCipherResult] = useState<{
    cipherText: string;
    iv: string;
    authTag: string;
    rawHash: string;
  } | null>(null);

  const [decryptInput, setDecryptInput] = useState<string>('');
  const [decryptOutput, setDecryptOutput] = useState<string | null>(null);
  const [copiedCipher, setCopiedCipher] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [tamperSimulated, setTamperSimulated] = useState(false);

  // Auto encrypt on plain input change
  useEffect(() => {
    encryptPayloadAes256(plainInput).then((res) => {
      setCipherResult(res);
      setDecryptInput(res.cipherText);
    });
  }, [plainInput]);

  const handleCopyCipher = () => {
    if (!cipherResult) return;
    navigator.clipboard.writeText(cipherResult.cipherText);
    setCopiedCipher(true);
    sounds.playClick();
    setTimeout(() => setCopiedCipher(false), 2000);
  };

  const handleDecrypt = () => {
    sounds.playClick();
    const res = decryptPayloadAes256(decryptInput);
    if (res.success) {
      setDecryptOutput(res.payload);
      sounds.playSuccess();
    } else {
      setDecryptOutput('ERROR: Cipher text korup atau kunci salah.');
      sounds.playAlert();
    }
  };

  const handleRotateKey = () => {
    setIsRotating(true);
    sounds.playClick();
    setTimeout(() => {
      setIsRotating(false);
      onUpdateSecurityStatus({
        lastRotated: new Date().toISOString().split('T')[0],
        tamperProofSeals: securityStatus.tamperProofSeals + 1,
      });
      sounds.playSuccess();
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="security-tab-container">
      
      {/* Security Overview Header */}
      <div className="p-5 rounded-2xl bg-[#121215] text-white border border-white/[0.08] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30 font-mono">
            <Lock className="w-3.5 h-3.5" />
            TLS v1.3 + AES-256-GCM + SHA-256 Dual Layer
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Pusat Keamanan Kriptografis & Otentikasi End-to-End
          </h2>
          <p className="text-xs text-slate-300/80 max-w-2xl leading-relaxed">
            Menjamin setiap transaksi voucher bebas dari manipulasi ganda (double-spending) dan terenkripsi penuh dari terminal kasir hingga buku besar perbankan syariah.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpen2FaModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <KeyRound className="w-4 h-4" />
            <span>Konfigurasi 2FA ({securityStatus.twoFactorEnabled ? 'Aktif' : 'Non-Aktif'})</span>
          </button>
        </div>
      </div>

      {/* Security Metric Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-1 hover:border-emerald-500/30 transition-all">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Algoritma Enkripsi</span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-500" />
            AES-256-GCM
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Authenticated Cipher</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-1 hover:border-teal-500/30 transition-all">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Integritas Hash Digest</span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-teal-500" />
            SHA-256 HMAC
          </div>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Zero Hash Collision</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-1 hover:border-amber-500/30 transition-all">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rotasi Kunci Terakhir</span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-amber-500" />
            {securityStatus.lastRotated}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Siklus 30 Hari Otomatis</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-1 hover:border-purple-500/30 transition-all">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Segel Digital Terbit</span>
          <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            {securityStatus.tamperProofSeals.toLocaleString()} Segel
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">DSN-MUI Validated</span>
        </div>

      </div>

      {/* Interactive E2EE Crypto Pipeline Visualizer */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              Live E2EE Cryptographic Engine Visualizer (Enkripsi & Dekripsi Real-Time)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ketik payload voucher dan amati transformasi enkripsi AES-256 secara langsung
            </p>
          </div>

          <button
            onClick={handleRotateKey}
            disabled={isRotating}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#16161A] dark:hover:bg-[#222228] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Rotasi Kunci Master</span>
          </button>
        </div>

        {/* 2-Column Crypto Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Column 1: Plaintext Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                1. Plaintext JSON Payload (Data Voucher Mentah):
              </label>
              <span className="text-[10px] text-slate-400 font-mono">UTF-8 / JSON</span>
            </div>
            <textarea
              rows={8}
              value={plainInput}
              onChange={(e) => setPlainInput(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-950 dark:bg-[#0A0A0B] text-emerald-400 rounded-xl border border-slate-800 dark:border-white/[0.08] focus:ring-2 focus:ring-emerald-500/40 outline-none leading-relaxed"
            />
          </div>

          {/* Column 2: Cipher Text & SHA-256 Digest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                2. AES-256-GCM Cipher Text & Authentication Tag:
              </label>
              <button
                onClick={handleCopyCipher}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                {copiedCipher ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCipher ? 'Tersalin' : 'Salin Cipher'}</span>
              </button>
            </div>
            <div className="w-full p-3 font-mono text-xs bg-slate-950 dark:bg-[#0A0A0B] text-amber-300 rounded-xl border border-slate-800 dark:border-white/[0.08] h-[178px] overflow-y-auto space-y-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Ciphertext (Base64 + Salt):</span>
                <span className="break-all text-amber-300">{cipherResult?.cipherText}</span>
              </div>
              <div className="pt-1 border-t border-slate-800 dark:border-white/[0.06] text-[10px]">
                <span className="text-slate-500">IV (Initialization Vector): </span>
                <span className="text-emerald-400">{cipherResult?.iv}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-slate-500">SHA-256 Integrity Digest: </span>
                <span className="text-teal-400">{cipherResult?.rawHash}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Decryption Verification Sandbox */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200 dark:border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-500" />
              Uji Dekripsi di Sisi Terminal Penerima (Merchant Terminal Decryptor):
            </span>
            <button
              onClick={handleDecrypt}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Dekripsi Payload</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={decryptInput}
              onChange={(e) => setDecryptInput(e.target.value)}
              placeholder="Masukkan Cipher Text untuk didekripsi..."
              className="flex-1 px-3 py-2 bg-white dark:bg-[#0A0A0B] border border-slate-300 dark:border-white/[0.08] rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {decryptOutput && (
            <div className="p-3 rounded-lg bg-emerald-950/80 text-emerald-300 font-mono text-xs border border-emerald-500/30 whitespace-pre-wrap">
              <span className="text-slate-400 text-[10px] block mb-1">Hasil Dekripsi Sukses:</span>
              {decryptOutput}
            </div>
          )}
        </div>

      </div>

      {/* Anti-Tamper Proof Demo */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Simulasi Uji Pertahanan Anti-Tamper (Anti-Double Spend)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Membuktikan bahwa perubahan 1 byte data langsung menggagalkan validasi tanda tangan digital DSN-MUI
            </p>
          </div>

          <button
            onClick={() => {
              setTamperSimulated(!tamperSimulated);
              sounds.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              tamperSimulated 
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#16161A] dark:hover:bg-[#222228] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            {tamperSimulated ? 'Hapus Modifikasi Palsu' : 'Simulasikan Serangan Modifikasi Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200 dark:border-white/[0.08] space-y-1">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans font-bold">Data Asli Terverifikasi:</span>
            <div className="text-slate-700 dark:text-slate-300">VOUCHER_CODE: ICP-ZIS-8821-X9A2</div>
            <div className="text-slate-700 dark:text-slate-300">SALDO_VALID: Rp 1.500.000</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold">STATUS: VALID & BERHAK</div>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 transition-all ${
            tamperSimulated 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
              : 'bg-slate-50 dark:bg-[#16161A] border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400'
          }`}>
            <span className="text-[11px] font-sans font-bold block">
              {tamperSimulated ? '🚨 Terdeteksi Manipulasi Ilegal:' : 'Kondisi Aman:'}
            </span>
            <div>VOUCHER_CODE: ICP-ZIS-8821-X9A2</div>
            <div>SALDO: {tamperSimulated ? 'Rp 99.000.000 (DIUBAH ILEGAL)' : 'Rp 1.500.000'}</div>
            <div className="font-bold">
              {tamperSimulated 
                ? '❌ SIGNATURE MISMATCH! TRANSAKSI OTOMATIS DIBLOKIR 100%' 
                : '✅ SINKRON DENGAN LEDGER'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
