import { adminCollectionRoute } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const route = adminCollectionRoute("models");

export const GET = route.GET;
export const POST = route.POST;
export const PUT = route.PUT;
export const DELETE = route.DELETE;
