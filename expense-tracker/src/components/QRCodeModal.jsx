// components/QRCodeModal.jsx
export default function QRCodeModal({ isOpen, qr_url, secret, onVerify }) {
    const [code, setCode] = useState('');
    return isOpen ? (
      <div className="modal">
        <img src={qr_url} alt="QR 2FA" />   {/* hoặc dùng qrcode.react */}
        <p>Secret: {secret}</p>
        <input type="text" maxLength={6} placeholder="Nhập mã 6 số" value={code} onChange={e => setCode(e.target.value)} />
        <button onClick={() => onVerify(code)}>Xác thực</button>
      </div>
    ) : null;
  }