import type { ComponentProps } from 'react';
import { Dialog } from './dialog';

export const Drawer = (props: ComponentProps<typeof Dialog>) => (
  <Dialog {...props} className="drawer-dialog" />
);
