import PetDetailClient from '@/components/pets/pet-detail-client';

interface PetDetailPageProps {
  params: {
    id: string;
  };
}

export default function PetDetailPage({ params }: PetDetailPageProps) {
  return <PetDetailClient petId={params.id} />;
}

// 為靜態導出生成預定義的寵物 ID
export async function generateStaticParams() {
  // 為了靜態導出，我們需要預定義一些寵物 ID
  // 在實際應用中，這些 ID 應該從 API 或數據庫獲取
  const petIds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'demo-1', 'demo-2', 'demo-3', 'demo-4', 'demo-5'
  ];

  return petIds.map((id) => ({
    id: id,
  }));
}
