import type { FC } from "react";
import type { ApplicationPayload } from "entities/Application";

// CE has no tracking provider, even when imported metadata contains identifiers.
const CustomerTracking: FC<{ application?: ApplicationPayload }> = () => null;

export default CustomerTracking;
