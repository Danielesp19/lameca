import { redirect } from "next/navigation";

// La carta vive en la raíz ("/") desde que se agregó el dominio propio — esto
// es solo un puente para cualquier enlace o marcador viejo que apunte a /menu.
export default function MenuRedirect() {
  redirect("/");
}
