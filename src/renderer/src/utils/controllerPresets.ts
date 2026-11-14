import type { VirtualButtonBinding, GameControllerConfig } from '../types';

export const XBOX_STANDARD_BUTTONS: VirtualButtonBinding[] = [
  // Left Side: D-Pad & Analog Stick
  { id: 'joystick', label: 'LS', type: 'joystick', x: 18, y: 38, size: 120, enabled: true },
  { id: 'dpad', label: 'D-Pad', type: 'dpad', x: 22, y: 78, size: 110, enabled: true },
  { id: 'lb', label: 'LB', type: 'gamepad_btn', targetKey: 'KeyQ', x: 18, y: 12, size: 60, enabled: true },
  { id: 'lt', label: 'LT', type: 'gamepad_btn', targetKey: 'KeyE', x: 8, y: 12, size: 60, enabled: true },

  // Center: Back & Start
  { id: 'select', label: 'VIEW', type: 'gamepad_btn', targetKey: 'Tab', x: 42, y: 16, size: 45, enabled: true },
  { id: 'start', label: 'MENU', type: 'gamepad_btn', targetKey: 'Escape', x: 58, y: 16, size: 45, enabled: true },

  // Right Side: ABXY & Right Shoulder
  { id: 'btn_a', label: 'A', type: 'gamepad_btn', targetKey: 'Space', x: 82, y: 75, size: 55, enabled: true },
  { id: 'btn_b', label: 'B', type: 'gamepad_btn', targetKey: 'KeyC', x: 91, y: 55, size: 55, enabled: true },
  { id: 'btn_x', label: 'X', type: 'gamepad_btn', targetKey: 'KeyR', x: 73, y: 55, size: 55, enabled: true },
  { id: 'btn_y', label: 'Y', type: 'gamepad_btn', targetKey: 'KeyF', x: 82, y: 35, size: 55, enabled: true },
  { id: 'rb', label: 'RB', type: 'gamepad_btn', targetKey: 'KeyZ', x: 82, y: 12, size: 60, enabled: true },
  { id: 'rt', label: 'RT', type: 'gamepad_btn', targetKey: 'KeyX', x: 92, y: 12, size: 60, enabled: true },
];

export const KEYBOARD_MOUSE_BUTTONS: VirtualButtonBinding[] = [
  // Left Movement
  { id: 'dpad_wasd', label: 'WASD', type: 'dpad', x: 20, y: 65, size: 120, enabled: true },
  { id: 'key_shift', label: 'SHIFT', type: 'key', targetKey: 'ShiftLeft', x: 10, y: 40, size: 55, enabled: true },
  { id: 'key_ctrl', label: 'CTRL', type: 'key', targetKey: 'ControlLeft', x: 10, y: 75, size: 55, enabled: true },

  // Center Actions
  { id: 'key_esc', label: 'ESC', type: 'key', targetKey: 'Escape', x: 50, y: 15, size: 45, enabled: true },

  // Right Actions & Mouse Trackpad
  { id: 'mouse_left', label: 'CLICK T', type: 'mouse_btn', targetKey: 'MouseLeft', x: 85, y: 75, size: 65, enabled: true },
  { id: 'mouse_right', label: 'CLICK P', type: 'mouse_btn', targetKey: 'MouseRight', x: 85, y: 40, size: 65, enabled: true },
  { id: 'key_space', label: 'SPACE (NHẢY)', type: 'key', targetKey: 'Space', x: 70, y: 80, size: 65, enabled: true },
  { id: 'key_e', label: 'E (DÙNG)', type: 'key', targetKey: 'KeyE', x: 72, y: 55, size: 55, enabled: true },
  { id: 'key_r', label: 'R (NẠP ĐẠN)', type: 'key', targetKey: 'KeyR', x: 72, y: 30, size: 55, enabled: true },
];

export const RACING_BUTTONS: VirtualButtonBinding[] = [
  { id: 'joystick_steer', label: 'LÁI', type: 'joystick', x: 20, y: 60, size: 130, enabled: true },
  { id: 'gas_rt', label: 'GA (RT)', type: 'gamepad_btn', targetKey: 'KeyW', x: 88, y: 50, size: 75, enabled: true },
  { id: 'brake_lt', label: 'PHANH (LT)', type: 'gamepad_btn', targetKey: 'KeyS', x: 74, y: 65, size: 70, enabled: true },
  { id: 'handbrake', label: 'PHANH TAY', type: 'key', targetKey: 'Space', x: 85, y: 80, size: 60, enabled: true },
  { id: 'nitro', label: 'NITRO', type: 'key', targetKey: 'ShiftLeft', x: 88, y: 22, size: 55, enabled: true },
  { id: 'cam_view', label: 'GÓC NHÌN', type: 'key', targetKey: 'KeyC', x: 50, y: 15, size: 50, enabled: true },
];

export const PRESET_MAP: Record<string, VirtualButtonBinding[]> = {
  'Xbox 360 Chuẩn': XBOX_STANDARD_BUTTONS,
  'Bàn Phím & Chuột': KEYBOARD_MOUSE_BUTTONS,
  'Đua Xe': RACING_BUTTONS,
};

export function getDefaultConfigForMode(mode: 'gamepad' | 'keyboard_mouse' | 'disabled'): GameControllerConfig {
  if (mode === 'disabled') {
    return { mode: 'disabled' };
  }
  if (mode === 'keyboard_mouse') {
    return {
      mode: 'keyboard_mouse',
      presetName: 'Bàn Phím & Chuột',
      customButtons: JSON.parse(JSON.stringify(KEYBOARD_MOUSE_BUTTONS)),
    };
  }
  return {
    mode: 'gamepad',
    presetName: 'Xbox 360 Chuẩn',
    customButtons: JSON.parse(JSON.stringify(XBOX_STANDARD_BUTTONS)),
  };
}

