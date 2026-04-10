import React, { useEffect, useRef, useState } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  action: () => void;
}

export interface MenuConfig {
  edge?: MenuItem[];
  node?: MenuItem[];
  pane?: MenuItem[];
}

interface ContextMenuProps {
  position: { x: number; y: number };
  targetType: 'edge' | 'node' | 'pane' | null;
  menuConfig: MenuConfig;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ position, targetType, menuConfig, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        e.preventDefault();
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Get menu items for the current target type
  const menuItems = targetType ? (menuConfig[targetType] ?? []) : [];

  if (!targetType || menuItems.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      {menuItems.map((item) => (
        <button
          key={item.id}
          className={`context-menu-item ${item.danger ? 'danger' : ''}`}
          onClick={() => {
            if (!item.disabled) {
              item.action();
              onClose();
            }
          }}
          disabled={item.disabled}
        >
          {item.icon && <span className="context-menu-icon">{item.icon}</span>}
          <span className="context-menu-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// Hook to show context menu
export function useContextMenu() {
  const [menuState, setMenuState] = useState<{
    show: boolean;
    position: { x: number; y: number };
    targetType: 'edge' | 'node' | 'pane' | null;
    targetId: string | null;
  }>({
    show: false,
    position: { x: 0, y: 0 },
    targetType: null,
    targetId: null,
  });

  const showMenu = (
    e: React.MouseEvent,
    targetType: 'edge' | 'node' | 'pane',
    targetId: string | null = null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuState({
      show: true,
      position: { x: e.clientX, y: e.clientY },
      targetType,
      targetId,
    });
  };

  const hideMenu = () => {
    setMenuState((prev) => ({ ...prev, show: false }));
  };

  return {
    menuState,
    showMenu,
    hideMenu,
    ContextMenuComponent: ContextMenu,
  };
}

export default ContextMenu;
