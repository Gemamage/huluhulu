import EditPetClient from '@/components/pets/edit-pet-client';

interface EditPetPageProps {
  params: {
    id: string;
  };
}

export default function EditPetPage({ params }: EditPetPageProps) {
  return <EditPetClient petId={params.id} />;
}

// 為靜態導出生成參數
export async function generateStaticParams() {
  // 預定義一些常見的寵物 ID，用於靜態生成
  // 在實際應用中，這裡應該從 API 獲取所有寵物 ID
  const staticPetIds = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'demo-1', 'demo-2', 'demo-3', 'demo-4', 'demo-5'
  ];

  return staticPetIds.map((id) => ({
    id: id,
  }));
}
