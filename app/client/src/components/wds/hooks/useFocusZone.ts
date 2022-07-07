import React, {useEffect} from 'react'
import {focusZone} from '../behaviours/focus-zone'
import type { FocusZoneSettings } from '../behaviours/focus-zone'
import {useProvidedRefOrCreate} from './useProvidedRefOrCreate'
export {FocusKeys} from '../behaviours/focus-zone'
export type {Direction} from '../behaviours/focus-zone'

export interface FocusZoneHookSettings extends Omit<FocusZoneSettings, 'activeDescendantControl'> {
  /**
   * Optional ref for the container that holds all elements participating in arrow key focus.
   * If one is not passed, we will create one for you and return it from the hook.
   */
  containerRef?: React.RefObject<HTMLElement>

  /**
   * If using the "active descendant" focus pattern, pass `true` or a ref to the controlling
   * element. If a ref object is not passed, we will create one for you.
   */
  activeDescendantFocus?: boolean | React.RefObject<HTMLElement>

  /**
   * Set to true to disable the focus zone and clean up listeners. Can be re-enabled at
   * any time.
   */
  disabled?: boolean
}

export function useFocusZone(
  settings: FocusZoneHookSettings = {},
  dependencies: React.DependencyList = []
): {containerRef: React.RefObject<HTMLElement>; activeDescendantControlRef: React.RefObject<HTMLElement>} {
  const containerRef = useProvidedRefOrCreate(settings.containerRef)
  const useActiveDescendant = !!settings.activeDescendantFocus
  const passedActiveDescendantRef =
    typeof settings.activeDescendantFocus === 'boolean' || !settings.activeDescendantFocus
      ? undefined
      : settings.activeDescendantFocus
  const activeDescendantControlRef = useProvidedRefOrCreate(passedActiveDescendantRef)
  const disabled = settings.disabled
  const abortController = React.useRef<AbortController>()

  useEffect(
    () => {
      if (
        containerRef.current instanceof HTMLElement &&
        (!useActiveDescendant || activeDescendantControlRef.current instanceof HTMLElement)
      ) {
        if (!disabled) {
          const vanillaSettings: FocusZoneSettings = {
            ...settings,
            activeDescendantControl: activeDescendantControlRef.current ?? undefined
          }
          abortController.current = focusZone(containerRef.current, vanillaSettings)
          return () => {
            abortController.current?.abort()
          }
        } else {
          abortController.current?.abort()
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, ...dependencies]
  )

  return {containerRef, activeDescendantControlRef}
}
