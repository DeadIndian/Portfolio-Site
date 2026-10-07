"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { JourneyController } from "./runtime";
import { journeyMarkup } from "./shell";

type JourneyProps = {
  active: boolean;
  switching: boolean;
  motion: boolean;
  motionLocked: boolean;
  onExit: () => void;
  onToggleMotion: () => void;
};

export function Journey(props: JourneyProps) {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<JourneyController | null>(null);
  const current = useRef(props);

  useLayoutEffect(() => {
    current.current = props;
    controller.current?.setMotion(props.motion, props.motionLocked);
    controller.current?.setVisible(props.active && !props.switching);
  }, [props]);

  useEffect(() => {
    if (!props.active || controller.current) return;
    let cancelled = false;
    void import("./runtime.js").then(({ mountJourney }) => {
      if (cancelled || !current.current.active || !root.current) return;
      controller.current = mountJourney(root.current, {
        motion: current.current.motion,
        motionLocked: current.current.motionLocked,
        onExit: () => current.current.onExit(),
        onToggleMotion: () => current.current.onToggleMotion(),
      });
      controller.current.setVisible(current.current.active && !current.current.switching);
    }).catch(() => {
      if (cancelled || !root.current) return;
      const status = root.current.querySelector<HTMLElement>("#render-status");
      if (status) status.textContent = "The journey could not load. Refresh to try again.";
    });
    return () => { cancelled = true; };
  }, [props.active]);

  useEffect(() => () => {
    controller.current?.destroy();
    controller.current = null;
  }, []);

  // This immutable, authored shell belongs to the journey controller. React
  // controls its visibility; the existing Three.js experience owns its children.
  return <div ref={root} className="journey-root" data-world="blocks" onClick={(event) => {
    if ((event.target as HTMLElement).closest("#journey-return")) props.onExit();
  }}
    hidden={!props.active} inert={!props.active || props.switching}
    dangerouslySetInnerHTML={{ __html: journeyMarkup }} />;
}
