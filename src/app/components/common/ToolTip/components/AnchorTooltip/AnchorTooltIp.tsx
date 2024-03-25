import * as React from 'react';
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import { Instance } from '@popperjs/core';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';

type ToolTipProps = {
  title?: any,
  children: any,
  shouldDisableHoverListener?: boolean,
  placement:
      | 'bottom-end'
      | 'bottom-start'
      | 'bottom'
      | 'left-end'
      | 'left-start'
      | 'left'
      | 'right-end'
      | 'right-start'
      | 'right'
      | 'top-end'
      | 'top-start'
      | 'top';
};

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.colors.gray80,
    },
    padding: 10,
    zIndex: 9999,
    fontSize: 12,
    maxWidth: 474,
    fontWeight: 500,
    lineHeight: 1.62,
    textAlign: 'left',
    overflow: 'visible',
    borderRadius: '6px',
    transition: 'opacity 0.3s',
    color: theme.colors.gray20,
    backgroundColor: theme.colors.gray80,
    '& p': {
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.62,
      color: theme.colors.primaryBlue,
    },
  },
}));

export default function AnchorElTooltips(props: ToolTipProps) {
  const { children, placement, title, shouldDisableHoverListener } = props;
  const positionRef = React.useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const popperRef = React.useRef<Instance>(null);
  const areaRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent) => {
    positionRef.current = { x: event.clientX, y: event.clientY };

    if (popperRef.current != null) {
      popperRef.current.update();
    }
  };

  return (
      <LightTooltip
          title={title}
          // style={{ alignItems: alignItems ?? 'center', display: 'flex' }}
          placement={placement ?? 'top'}
          disableHoverListener={shouldDisableHoverListener}
          arrow
          PopperProps={{
            popperRef,
            anchorEl: {
              getBoundingClientRect: () => {
                return new DOMRect(
                    positionRef.current.x,
                    areaRef.current!.getBoundingClientRect().y,
                    0,
                    0,
                );
              },
            },
          }}
      >
        <Grid style={{ maxWidth: '100%' }} ref={areaRef} onMouseMove={handleMouseMove}>
          {children}
        </Grid>
      </LightTooltip>
  );
}