import { useRef, useState } from "react";
import type {
  ChangeEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
} from "react";

import { SeekInputParser } from "./SeekInputParser.js";
import type { SeekTarget } from "./SeekTarget.js";
import { SeekTargetKind } from "./SeekTargetKind.js";
import type { TimeIdFieldProps } from "./TimeIdFieldProps.js";

const parser: SeekInputParser = new SeekInputParser();

/**
 * Shows the time id on screen and jumps to a typed one on Enter.
 *
 * Accepts a time id such as `123`, or a clock time such as `1:23.4`. Enter
 * jumps and hands focus back to the player, so frame stepping can follow at
 * once; Escape discards the typed text. Ids off the grid or outside the range snap to the
 * nearest frame the player can show.
 *
 * @param props - Player, snapshot and accessible name.
 * @returns The field.
 */
export function TimeIdField({ controller, snapshot, label, inputRef, onFinish }: TimeIdFieldProps): ReactElement {
  const [draft, setDraft] = useState<string | null>(null);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const isJustFocusedRef: { current: boolean } = useRef<boolean>(false);
  const currentText: string = snapshot.timeId === null ? "" : String(snapshot.timeId);

  const commit: (input: HTMLInputElement) => void = (input: HTMLInputElement): void => {
    const target: SeekTarget | null = parser.parse(input.value);
    if (target === null) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    setDraft(null);
    input.blur();
    onFinish();
    void (target.kind === SeekTargetKind.TIME_ID ? controller.seekToTimeId(target.value) : controller.seekToSeconds(target.value));
  };

  const onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        commit(event.currentTarget);
        return;
      case "Escape":
        event.preventDefault();
        setDraft(null);
        setIsInvalid(false);
        event.currentTarget.blur();
        onFinish();
        return;
      default:
        return;
    }
  };

  return (
    <label className="vpui-time-id" data-vpui-tooltip={label} data-invalid={isInvalid}>
      <span aria-hidden="true">#</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        spellCheck={false}
        autoComplete="off"
        aria-label={label}
        aria-invalid={isInvalid}
        value={draft ?? currentText}
        size={Math.max(4, currentText.length + 1)}
        onFocus={(event: ReactFocusEvent<HTMLInputElement>) => {
          isJustFocusedRef.current = true;
          setDraft(event.currentTarget.value);
          event.currentTarget.select();
        }}
        onMouseUp={(event: ReactMouseEvent<HTMLInputElement>) => {
          if (isJustFocusedRef.current) {
            event.preventDefault();
            isJustFocusedRef.current = false;
          }
        }}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          isJustFocusedRef.current = false;
          setDraft(event.currentTarget.value);
          setIsInvalid(false);
        }}
        onBlur={() => {
          setDraft(null);
          setIsInvalid(false);
        }}
        onKeyDown={onKeyDown}
      />
    </label>
  );
}
