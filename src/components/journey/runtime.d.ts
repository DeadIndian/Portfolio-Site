export interface JourneyController {
  setVisible(visible: boolean): void;
  setMotion(enabled: boolean, locked: boolean): void;
  destroy(): void;
}

export function mountJourney(root: HTMLDivElement, options: {
  motion: boolean;
  motionLocked: boolean;
  onExit: () => void;
  onToggleMotion: () => void;
}): JourneyController;
