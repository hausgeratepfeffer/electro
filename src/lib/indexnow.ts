import { siteUrl } from "@/server/merchant";

/**
 * Notification IndexNow (Bing, Yandex, Seznam, Naver) : signale une page
 * nouvelle ou modifiée immédiatement, au lieu d'attendre le prochain passage
 * du robot. Repéré par Bing Webmaster Tools comme premier point d'action du
 * site ("Set up IndexNow and boost your site's visibility").
 *
 * La clé n'est pas un secret — c'est une simple preuve de propriété du
 * domaine, vérifiée par le fichier qu'elle nomme (public/<clé>.txt). Elle
 * peut donc rester en dur ici plutôt que dans une variable d'environnement :
 * un déploiement qui l'oublierait romprait silencieusement la fonctionnalité,
 * comme cela s'est produit avec les identifiants Cloudinary cette session.
 */
const INDEXNOW_KEY = "97b5243f4f94453a96e6ddd8b130bb7d";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Signale une ou plusieurs URL. Best-effort et silencieux : IndexNow est une
 * notification qui accélère l'indexation, jamais une dépendance — une panne
 * de leur API ne doit jamais faire échouer l'enregistrement qui l'a déclenchée.
 */
export async function pingIndexNow(urls: readonly string[]): Promise<void> {
  const urlList = [...new Set(urls.filter(Boolean))];
  if (urlList.length === 0) return;

  const base = siteUrl();
  const host = new URL(base).host;

  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  } catch (error) {
    console.error("[indexnow] échec de la notification", error);
  }
}
