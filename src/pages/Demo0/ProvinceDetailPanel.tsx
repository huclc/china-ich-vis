import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useProvinceStore } from "@/stores/useProvinceStore";
import styled from "styled-components";
import { gsap } from "gsap";

/* ========== Styled ========== */
const PanelRoot = styled.div<{ $visible: boolean }>`
  position: fixed;
  right: 24px;
  top: 80px;
  width: 280px;
  max-height: calc(100vh - 200px);
  z-index: 9999;
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.25s ease;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  background: rgba(255, 245, 232, 0.88);
  border: 1px solid rgba(199, 164, 106, 0.35);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(199, 164, 106, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const ProvinceName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e2529;
  letter-spacing: 0.04em;
`;

const ItemCount = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
  border-radius: 4px;
  &:hover {
    color: #ea580c;
    background: rgba(234, 88, 12, 0.08);
  }
`;

const ScrollWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  /* hide scrollbar */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const ListItem = styled.div`
  padding: 6px 16px;
  border-bottom: 1px solid rgba(93, 166, 174, 0.06);
  transition: background 0.15s;
  &:hover { background: rgba(93, 166, 174, 0.06); }
`;

const ItemName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #1e2529;
  line-height: 1.4;
`;

const ItemMeta = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  display: flex;
  gap: 6px;
`;

interface IchItem {
  name: string;
  category: string;
  county: string;
  city: string;
}

export default function ProvinceDetailPanel() {
  const selectedProvince = useProvinceStore((s) => s.selectedProvince);
  const selectProvince = useProvinceStore((s) => s.selectProvince);
  const [items, setItems] = useState<IchItem[]>([]);
  const [allData, setAllData] = useState<Record<string, IchItem[]> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);

  const visible = selectedProvince !== null;

  // Load province list data once
  useEffect(() => {
    fetch("/ich_province_list.json")
      .then((r) => r.json())
      .then((d) => setAllData(d))
      .catch(console.error);
  }, []);

  // Update items when province changes
  useEffect(() => {
    if (selectedProvince && allData) {
      setItems(allData[selectedProvince] || []);
    } else {
      setItems([]);
    }
  }, [selectedProvince, allData]);

  // GSAP slide in/out
  useEffect(() => {
    if (!panelRef.current) return;
    if (visible) {
      gsap.fromTo(panelRef.current,
        { x: 320, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [visible]);

  // Auto-scroll
  useEffect(() => {
    if (!visible || items.length === 0 || !scrollRef.current) return;

    const el = scrollRef.current;
    let raf: number;

    const step = () => {
      if (!pauseRef.current) {
        el.scrollTop += 0.4; // slow scroll
        // Loop back to top when reaching bottom
        if (el.scrollTop >= el.scrollHeight - el.clientHeight) {
          el.scrollTop = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, items]);

  if (!visible) return null;

  return createPortal(
    <PanelRoot
      ref={panelRef}
      $visible={visible}
      onMouseEnter={() => { pauseRef.current = true; }}
      onMouseLeave={() => { pauseRef.current = false; }}
    >
      <PanelHeader>
        <div>
          <ProvinceName>{selectedProvince}</ProvinceName>
          <ItemCount>{items.length} 个地点</ItemCount>
        </div>
        <CloseBtn onClick={() => selectProvince(null)}>✕</CloseBtn>
      </PanelHeader>
      <ScrollWrap ref={scrollRef}>
        {items.map((item, i) => (
          <ListItem key={i}>
            <ItemName>{item.name}</ItemName>
            <ItemMeta>
              <span>{item.category}</span>
              <span>·</span>
              <span>{item.city || item.county}</span>
            </ItemMeta>
          </ListItem>
        ))}
      </ScrollWrap>
    </PanelRoot>,
    document.body
  );
}
