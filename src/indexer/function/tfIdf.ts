/**
 *
 * @param word Le mots cible
 * @param pageWordList La list des mots de la page
 * @param docsWithWord Le nombre totals de documents contenants le mots
 * @param totalDocs le nombre total de documents enregistrés
 * @returns {number}
 *
 * @description Le TF-IDF (de l'anglais term frequency-inverse document frequency) est une méthode de pondération souvent utilisée en recherche d'information et en particulier dans la fouille de textes. Cette mesure statistique permet d'évaluer l'importance d'un terme contenu dans un document, relativement à une collection ou un corpus. Le poids augmente proportionnellement au nombre d'occurrences du mot dans le document. Il varie également en fonction de la répartition du mot dans le corpus. Des variantes de la formule originale sont souvent utilisées dans des moteurs de recherche pour apprécier la pertinence d'un document en fonction des critères de recherche de l'utilisateur. <source: WIKIPEDIA>
 */
export function tfIdf(
  word: string,
  pageWordList: string[],
  docsWithWord: number,
  totalDocs: number,
): number {
  // TF
  const tf =
    pageWordList.filter((w) => w === word).length / pageWordList.length;

  // IDF
  const idf = Math.log(totalDocs + 1 / (docsWithWord + 1));

  return tf * idf;
}
