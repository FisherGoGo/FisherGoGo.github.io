import { lilyExhibit } from "../../../data/lily";

export function GET() {
	return Response.json(lilyExhibit);
}
