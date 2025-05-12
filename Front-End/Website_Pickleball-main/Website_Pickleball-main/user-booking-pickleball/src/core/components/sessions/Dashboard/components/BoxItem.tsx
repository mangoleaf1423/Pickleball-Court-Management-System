import classNames from 'classnames';
import React from 'react';
import colors from 'tailwindcss/colors';

import { ReactComponent as DecreaseImage } from '@/assets/images/decrease.svg';
import { ReactComponent as IncreaseImage } from '@/assets/images/increase.svg';

interface BoxItemProps {
  label: React.ReactNode;
  value: string | number;
  icon: React.ReactElement;
  ratioCompare?: number;
  isRatioCompare?: boolean;
  image?: string;
}

const BoxItem: React.FC<BoxItemProps> = ({ label, value, icon, ratioCompare, isRatioCompare = true }) => {
  return (
    <div className="h-full w-full rounded-md border border-gray-100 bg-white">
      <div className=" flex h-full flex-wrap items-center justify-between gap-x-4 px-6 py-4">
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-gray-500">{label}</span>

          <div className={classNames('mt-1 flex flex-wrap items-end gap-1 font-semibold')}>
            <span className="text-3xl">{value}</span>

            <div className={classNames('flex', { hidden: !isRatioCompare })}>
              {ratioCompare && ratioCompare > 0 ? (
                <IncreaseImage width={16} height={16} color={colors['green'][600]} />
              ) : (
                <DecreaseImage width={16} height={16} color={colors['red'][600]} />
              )}

              <span
                className={classNames(
                  'ml-1 text-sm',
                  ratioCompare && ratioCompare > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {`${Math.abs(ratioCompare ?? 0)}% `}
              </span>
            </div>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100">{icon}</div>
      </div>
    </div>
  );
};

export default BoxItem;
