import OrderConfirmationClient from "./OrderConfirmationClient";

export function generateStaticParams() {
  return [{ orderId: "sample" }];
}

export default function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  return <OrderConfirmationClient orderId={params.orderId} />;
}
