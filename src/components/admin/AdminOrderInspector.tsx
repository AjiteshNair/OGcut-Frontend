import React, { useEffect, useRef, useState } from 'react';

type OrderStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PRINTING'
  | 'FULFILLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

interface Placement {
  id: string;
  zone: string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  clipWidth: number;
  clipHeight: number;
}

interface CustomShirtOrder {
  id: string;
  fabricColor: string;
  placements: Placement[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product?: {
    id: number;
    name: string;
  };
  customShirtOrder?: CustomShirtOrder;
}

interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: OrderItem[];
}

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'RECEIVED',
  'PROCESSING',
  'PRINTING',
  'FULFILLED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export const AdminOrderInspector: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [activeZone, setActiveZone] = useState<string>('front');
  const [updating, setUpdating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch(`http://localhost:3001/api/admin/orders/${orderId}`)
      .then((res) => res.json())
      .then((data: Order) => {
        setOrder(data);

        // Find initial custom item placements if present
        const firstCustom = data.items?.find((item) => item.customShirtOrder);
        if (firstCustom?.customShirtOrder?.placements?.[0]) {
          setActiveZone(firstCustom.customShirtOrder.placements[0].zone);
        }
      });
  }, [orderId]);

  const currentItem = order?.items?.[activeItemIndex];
  const customShirt = currentItem?.customShirtOrder;
  const currentPlacement = customShirt?.placements?.find((p) => p.zone === activeZone);

  // Reconstruct 2D canvas print preview for custom items
  useEffect(() => {
    if (!canvasRef.current || !customShirt) return;

    const placement = customShirt.placements?.find((p) => p.zone === activeZone);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Fabric Background
    ctx.fillStyle = customShirt.fabricColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!placement) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = placement.imageUrl;

    img.onload = () => {
      ctx.save();

      // Render Print Boundary Box
      if (placement.clipWidth > 0 && placement.clipHeight > 0) {
        const clipX = placement.centerX - placement.clipWidth / 2;
        const clipY = placement.centerY - placement.clipHeight / 2;

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(clipX, clipY, placement.clipWidth, placement.clipHeight);

        ctx.beginPath();
        ctx.rect(clipX, clipY, placement.clipWidth, placement.clipHeight);
        ctx.clip();
      }

      // Matrix Transformations
      ctx.translate(placement.x, placement.y);
      ctx.scale(placement.scale, placement.scale);

      ctx.drawImage(
        img,
        -placement.width / 2,
        -placement.height / 2,
        placement.width,
        placement.height
      );

      ctx.restore();
    };
  }, [customShirt, activeZone]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`http://localhost:3001/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrder({ ...order, status: newStatus });
      }
    } finally {
      setUpdating(false);
    }
  };

  if (!order) return <div style={{ color: '#fff', padding: '20px' }}>Loading order details...</div>;

  const customerName = order.user
    ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || order.user.email
    : 'Guest Customer';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', padding: '24px', background: '#121212', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Left Column: Visual Print Inspector & Items Selector */}
      <div style={{ background: '#1e1e1e', borderRadius: '12px', padding: '20px' }}>
        
        {/* Item Navigation Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>
              Item {activeItemIndex + 1} of {order.items.length}: {customShirt ? `Custom T-Shirt (${customShirt.fabricColor})` : currentItem?.product?.name || 'Standard Product'}
            </h2>
          </div>

          {/* Zones Switcher (if Custom Item) */}
          {customShirt && (
            <div>
              {customShirt.placements.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveZone(p.zone)}
                  style={{
                    margin: '0 4px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeZone === p.zone ? '#2563eb' : '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {p.zone.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Selector Tabs */}
        {order.items.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {order.items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItemIndex(idx);
                  if (item.customShirtOrder?.placements?.[0]) {
                    setActiveZone(item.customShirtOrder.placements[0].zone);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  background: activeItemIndex === idx ? '#3b82f6' : '#2a2a2a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Item #{idx + 1} {item.customShirtOrder ? '(Custom 🎨)' : ''}
              </button>
            ))}
          </div>
        )}

        {/* Canvas or Standard Product Placeholder */}
        <div style={{ textAlign: 'center' }}>
          {customShirt ? (
            <canvas
              ref={canvasRef}
              width={500}
              height={600}
              style={{ border: '2px solid #333', borderRadius: '8px', maxWidth: '100%', height: 'auto' }}
            />
          ) : (
            <div style={{ padding: '60px', background: '#2a2a2a', borderRadius: '8px', color: '#aaa' }}>
              Standard product item (No custom 3D canvas coordinates)
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Customer Details & Status Control */}
      <div style={{ background: '#1e1e1e', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Status Selector */}
        <div>
          <label style={{ fontSize: '12px', textTransform: 'uppercase', color: '#aaa', fontWeight: 'bold' }}>Order Status</label>
          <select
            value={order.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '10px',
              borderRadius: '6px',
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Customer & Delivery Summary */}
        <div style={{ background: '#252525', padding: '14px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Customer Information</h4>
          <p style={{ margin: '0 0 4px 0' }}><strong>Name:</strong> {customerName}</p>
          <p style={{ margin: '0 0 4px 0' }}><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
          <p style={{ margin: '0 0 4px 0' }}><strong>Total Charged:</strong> ${Number(order.totalAmount).toFixed(2)}</p>
          <p style={{ margin: 0 }}><strong>Placed On:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        {/* Shipping Address */}
        {order.address && (
          <div style={{ background: '#252525', padding: '14px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Shipping Address</h4>
            <p style={{ margin: '0 0 2px 0' }}>{order.address.line1}</p>
            {order.address.line2 && <p style={{ margin: '0 0 2px 0' }}>{order.address.line2}</p>}
            <p style={{ margin: '0 0 2px 0' }}>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
            <p style={{ margin: 0 }}><strong>Phone:</strong> {order.address.phone}</p>
          </div>
        )}

        {/* Selected Placement Details & Download Button */}
        {currentPlacement && (
          <div style={{ background: '#252525', padding: '14px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>Print Coordinates ({currentPlacement.zone})</h4>
            <p style={{ margin: '0 0 4px 0' }}><strong>Offset X:</strong> {currentPlacement.x.toFixed(2)}px</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>Offset Y:</strong> {currentPlacement.y.toFixed(2)}px</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>Scale:</strong> {currentPlacement.scale.toFixed(2)}x</p>
            <p style={{ margin: '0 0 12px 0' }}><strong>Dimensions:</strong> {currentPlacement.width.toFixed(0)}px × {currentPlacement.height.toFixed(0)}px</p>

            <a
              href={currentPlacement.imageUrl}
              target="_blank"
              download={`order-${order.id}-${currentPlacement.zone}.png`}
              rel="noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '10px',
                background: '#16a34a',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
              }}
            >
              📥 Download High-Res Asset
            </a>
          </div>
        )}
      </div>
    </div>
  );
};