import { Box } from '@/core/components';
import { Skeleton } from 'antd';

const BoxSkeleton = () => {
  return (
    <Box>
      <Skeleton avatar paragraph={{ rows: 2 }} active title={false} />
    </Box>
  );
};

export default BoxSkeleton;
