/** Coloured circular marks mapped visually from the supplied overview photos.
 * Visual marks only: no inferred vote totals or meaning. Coordinates are
 * approximate, like the hand-mapped note corners, rather than a 3D scan.
 */
type Mark = [x:number,y:number,color:string];
const blue='#375c99', purple='#795789', green='#759847', amber='#b79746', coral='#bb7053';
export const BOARD_MARKS: Mark[][] = [
  [[.223,.12,blue],[.224,.136,blue],[.226,.15,blue],[.226,.165,green],
   [.267,.29,blue],[.27,.307,purple],[.887,.365,green]],
  [[.29,.198,purple],[.212,.229,green],[.478,.177,green],[.478,.196,green],[.476,.214,blue],
   [.477,.302,purple],[.898,.185,purple],[.787,.264,green],[.765,.282,coral],[.807,.288,amber],
   [.825,.361,amber],[.878,.383,purple],[.849,.402,blue],
   [.588,.55,blue],[.588,.565,coral],[.592,.58,green],[.594,.596,amber],[.597,.61,blue],
   [.618,.577,purple],[.646,.583,purple],[.22,.599,green],[.18,.609,purple],
   [.568,.652,amber],[.575,.664,coral],[.577,.676,blue],[.585,.685,green],
   [.575,.696,green],[.576,.706,purple],[.572,.717,coral],
   [.796,.679,purple],[.869,.786,purple],[.885,.799,green],[.887,.81,coral],
   [.888,.823,coral],[.88,.835,green],[.89,.848,amber],[.876,.86,purple],[.878,.873,green],[.872,.886,purple]],
  [[.195,.207,green],[.207,.216,purple],[.023,.259,green],[.025,.274,amber],[.035,.282,purple],
   [.063,.252,purple],[.095,.272,coral],[.109,.276,blue],[.137,.247,purple],[.208,.246,blue],
   [.71,.235,blue],[.718,.26,amber],[.706,.267,coral],[.673,.261,blue],[.64,.267,blue],[.624,.26,coral],
   [.34,.473,blue],[.375,.463,blue],[.42,.468,green],
   [.18,.599,blue],[.204,.604,coral],[.383,.636,purple],[.42,.63,purple],
   [.432,.637,blue],[.458,.624,blue],[.475,.633,green],[.69,.624,purple],
   [.56,.697,coral],[.582,.697,green],[.573,.728,purple],
   [.116,.716,green],[.186,.72,purple],[.211,.72,purple],
   [.18,.781,amber],[.23,.777,purple],[.235,.797,green],[.09,.9,blue]],
  [[.557,.85,green]],
];
