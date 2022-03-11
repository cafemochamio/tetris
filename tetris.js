//------------------
// 初期値
//------------------
const CELL = 20; //テトリミノ(正方形)の一辺の長さ
let row,col; //行・列ループカウンター
let target; //移動対象テトリミノ番号
const startY=2, startX=5; //テトリミノ落下開始位置（2 行 5 列）
let cY=startY,cX=startX; //テトリミノ左上セルの位置
let total; //得点
const delPoint = [0,50,100,300,1000]; //行削除の加算点
let gameID; //関数呼び出しID
let Level = 1;//GAME レベル（開始／RPLAY 時に「1」セット）
const maxLevel = 7; //最高レベル
let LineCnt = 0; //削除行数カウンタ（開始／REPLAY／レベル UP 時に「0」クリア）
let LupLine = 5; //レベル UP 条件（削除行数）
let Speed = 680; //GAME 速度（開始／RPLAY 時に「680」セット）
let LupSpeed = 100; //レベル UP 速度（参考：最高速は 680-100×6 回）
var BGMspeed = 1.2; //再生速度
var BGM = new Audio('./tetris.mp3'); //音声オブジェクトの新規作成
BGM.playbackRate = BGMspeed; //再生 speed 1 未満(遅い),1(標準),1 超(速い)
BGM.loop = true; //繰返し再生指定

//色配列
const tetColor =
[
//テトリミノ
"yellow","aqua","lime","red","blue","#F60","purple",
//壁面、背景、NEXT 領域、フィールド
"#999","#FFC","#DDD","white"
];
//Bonus テトリミノ
const bonusJudge = 5; //出現条件数（5 はテスト用）
let targetCnt; //落下テトリミノ出現回数
let nextCnt; //NEXT 出現回数
let multiple; //得点計算の倍数

//キャンバスのフィールド行（初期状態）
const fildLine = [ 8, 7,10,10,10,10,10,10,10,10,10,10, 7, 8];

//キャンバスの２次元配列（28 行×14 列）
let canvas = [];
var i;
for(i=0;i< 2;i++)
{ canvas.push( [ 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8] ); }
for(i=0;i< 3;i++)
{ canvas.push( [ 8, 8, 8, 8, 7, 9, 9, 9, 9, 7, 8, 8, 8, 8] ); }
canvas.push( [ 8, 7, 7, 7, 7, 9, 9, 9, 9, 7, 7, 7, 7, 8] );
for(i=0;i<20;i++)
{ canvas.push( fildLine.slice(0, fildLine.length) ); }
canvas.push( [ 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8] );
canvas.push( [ 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8] );

//テトリミノ表示セル位置（7 種類×[Y,X]×4 コ）
const tetModel = [
	[ [1,1],[1,2],[2,1],[2,2] ], //O 型
	[ [1,0],[1,1],[1,2],[1,3] ], //I 型
	[ [1,2],[1,3],[2,1],[2,2] ], //S 型
	[ [1,0],[1,1],[2,1],[2,2] ], //Z 型
	[ [1,0],[2,0],[2,1],[2,2] ], //J 型
	[ [1,3],[2,1],[2,2],[2,3] ], //L 型
	[ [1,1],[2,0],[2,1],[2,2] ]	 //T 型
];

//NEXT 領域とフィールド内クリア（開始行,開始列,行数,列数,値）
function clearCanvas(y,x,h,w,val)
{
	for(row=y;row<y+h;row++)
	{
		for(col=x;col<x+w;col++){ canvas[row][col] = val; }
	}
}

//------------------
// キャンバス関連
//------------------
const can = document.getElementById('Canvas');
const ctx = can.getContext('2d');
//DOM ツリーの element アドレス取得
const score = document.getElementById('score');
const level = document.getElementById('level');
const HighS = document.getElementById('HighS');

//キャンバス outline 表示
can.setAttribute( "width" , CELL*14 );
can.setAttribute( "height", CELL*28 );
can.setAttribute( "style" , "outline:1px solid #000;" );
//「NEXT」表示文字
ctx.font = "20px 'ＭＳ ゴシック'";
ctx.textAlign = "center";

//テトリミノ枠線（黒）
ctx.strokeStyle = "#000";

//------------------
// 主処理
//------------------
//ゲーム開始時のテトリミノ
target = parseInt(Math.random() * tetModel.length);
next   = parseInt(Math.random() * tetModel.length);

//キャンバス描画
drawCanvas( );

function play()
{
//テトリミノのセル位置を下にずらす
if( collide( 1, 0) ){
  cY++;
  drawCanvas();
 }
  //落下できなくなった場合
  else
  {
    if(cY>3)//game継続
    {
      //停止テトリミノ表示セルの色値をキャンバスにセット
      setCell( );

			//行削除 & 得点加算（位置確定点＋削除行数に応じた得点）*Bonus倍数*Level
			var landPoint = 1;										 //通常は１点
			if( targetCnt == 0 ){ landPoint = 2; } //Bonus は２点
			var LC = lineDelete( );
			//console.log("targetCnt:",targetCnt, "着地点:",landPoint, "削除行;",LC,"倍数:",multiple);
			total += (landPoint+delPoint[LC])*multiple*Level;

			//レベル UP（削除行数が 5 以上で、レベルが 7 未満）
			LineCnt += LC;
			if( LineCnt>=LupLine && Level<maxLevel)
			{
				Level++; 													//レベル UP
				Speed -= LupSpeed;							 //テトリミノ落下速度変更
				levelChange(total,Level,Speed);	//レベル変更
				BGMspeed += 0.2;　　　　　　　　　　//BGMspeed変更
				BGM.playbackRate = BGMspeed;

			}
				else{levelChange(total);}//スコア表示
      	//NEXTテトリミノをtargetにコピー
  			target = next;
  			cY = startY;
  			cX = startX;
				targetCnt = nextCnt; //target 数 UP
				//テトリミノが一定数以上出現し、一定確率を超えたら
				if( nextCnt >= bonusJudge && Math.random()+0.1 > 1 )
				{ nextCnt = 0 }
				else{ nextCnt++; } //NEXT 数 UP

      //新たなNEXT番号生成
			next = parseInt(Math.random() * tetModel.length);
			//arydeb();//デバッグ用
    }
    else //gameover
    {
      clearInterval(gameID);gameID = 0; //gameID = "";
      gameOver();
			//High スコア表示
			var ymd = new Date();
			HighS.innerHTML +=
			total+"点 " + ymd.getHours()+":" +ymd.getMinutes()+"<br>"
			//BGMpause
			BGM.pause();
			BGMspeed = 1.2;
			BGM.playbackRate = BGMspeed;
			BGM.currentTime = 0;
    }
  }
}

//------------------
// キーイベント
//------------------
document.onkeydown = function(e)
{

	//[Enter]キーならゲーム開始／リプレイ
if( e.keyCode == 13 )
{
	clearCanvas(2, 5, 4, 4, 9);				 //NEXT 領域クリア
	clearCanvas(6, 2,20,10,10);				 //フィールド内クリア
	cY=startY,cX=startX; 							//テトリミノを START 位置に戻す
	total = 0; 												//得点ゼロクリア
	Level = 1; 												//レベルクリア
	Speed = 680; 											//ゲーム開始時の初期速度
	levelChange( total,Level,Speed ); //レベル変更

	BGMspeed = 1.2;
	BGM.playbackRate = BGMspeed;
	BGM.currentTime = 0; //再生位置を先頭に戻す
	BGM.play(); //BGM の再生
	targetCnt=1, nextCnt=2; //出現回数初期化（1 番目、2 番目）
}

//ゲーム中ならカーソル移動とスペースキーを受け付ける
if( gameID > 0 )
{
  switch(e.keyCode)
  {
  	//collide( 行移動量, 列移動量 )
    case 37: if( collide( 0,-1) ){ cX--; } break; //左
    //case 38: if( collide(-1, 0) ){ cY--; } break; //上
    case 39: if( collide( 0, 1) ){ cX++; } break; //右
    case 40: if( collide( 1, 0) ){ cY++; } break; //下
		case 32: if( target > 0 ){ rotate(); } break;	//テトリミノ回転
    }
    drawCanvas( );  //キャンバス描画
  }
};
//------------------
// レベル変更
//------------------
//Total:必須受領、Level と Speed は受領しない場合あり）
function levelChange(T,L,S)
{
	score.innerHTML = total; //画面 score 変更
	if( L ) 								//Level がセットされていれば
	{
		level.innerHTML = Level; //画面 level 変更
		LineCnt = 0;						//レベル内削除行数クリア
		clearInterval(gameID); //起動済の関数呼出し速度変更
		gameID = setInterval( play,Speed);
	}
}
//------------------
// ゲーム画面描画
//------------------

function drawCanvas( )
{
  //キャンバス描画
  for(row=0;row<canvas.length;row++)
  {
    for(col=0;col<canvas[row].length;col++)
    {
      //セル描画
      ctx.fillStyle = tetColor[canvas[row][col]%100];
      ctx.fillRect(CELL*col, CELL*row, CELL, CELL);

      //テトリミノなら枠線表示
      if(canvas[row][col]%100<7 )
      { ctx.strokeRect(CELL*col, CELL*row, CELL, CELL);}
			//Bonus テトリミノなら
			if( canvas[row][col] >= 100 ){ drawBonus(col,row); }
    }
  }

//「NEXT」表示
ctx.font = "20px 'ＭＳ ゴシック'";
ctx.fillStyle = "black";
ctx.fillText("NEXT", CELL*7, CELL*1.5);

//テトリミノ(4行×4列)全体がフィールドに入ったら NEXTテトリミノ表示
	if( cY > 5){	drawTetrimino( next, startY, startX,nextCnt );	}
  //テトリミノ表示
	drawTetrimino( target, cY, cX,targetCnt )
};

function drawTetrimino(tNum, row, col,cnt)
{
  //テトリミノ描画
  for(var i=0;i<4;i++)
  {
		//表示セル座標
		var x = col+tetModel[tNum][i][1];
		var y = row+tetModel[tNum][i][0];
    //セル描画
		ctx.fillStyle = tetColor[tNum];
		ctx.fillRect  (CELL*x,CELL*y, CELL, CELL);
		ctx.strokeRect(CELL*x,CELL*y, CELL, CELL);

		if( cnt == 0 ){ drawBonus(x,y); }
		{
		drawBonus(x,y);
  	}
	}
}
function drawBonus(x,y)
{
	//Bonus マーク表示
	ctx.fillStyle = "black";
	ctx.font = "14px 'ＭＳ ゴシック'";
	ctx.fillText( "★", CELL*x+CELL/2, CELL*y+CELL*0.75 );
}


//------------------
// Tetrimino回転
//------------------
function rotate( )
{
  //回転用配列宣言
  var tmpAry=[];
  for(var i=0;i<4;i++)
  {
    //回転先セルのキャンバス位置の値をチェック
    if( canvas[cY+tetModel[target][i][1]][cX+(3-tetModel[target][i][0])%100] > 8 )
    {
      //右 90 度回転したセル値をセット
      tmpAry.push( [ tetModel[target][i][1], 3-tetModel[target][i][0] ] );
    }
    //回転強制終了
    else{ i = 4; }
  }

//回転用配列をテトリミノ配列にコピー
if( tmpAry.length == 4 ){ tetModel[target] = tmpAry; }
}


//------------------
// あたり判定
//------------------
//移動対象テトリミノの全表示セルが移動先に描画可能か判定
function collide( y, x )
{
  var judge = true;
  for(var i=0;i<4;i++)
  {
    if( canvas[cY+y+tetModel[target%100][i][0]]
              [cX+x+tetModel[target%100][i][1]]%100< 9 ) //canvas 描画禁止セルか？
      { judge = false; } //移動 NG をセット
    }
    return judge; //移動の判定結果を返す
}

//------------------
// 表示セル色値セット
//------------------
function setCell( )
{
	//Bonus テトリミノのセット値を「+100」
	var color = target;
	if( targetCnt == 0 ){ color += 100; }
  for(var i=0;i<4;i++)
  {
    //表示セルが停止したキャンバス位置に色番号をセット
    canvas[ cY+tetModel[target][i][0] ][ cX+tetModel[target][i][1] ] = color;
  }
}
//---------------------
// 行削除
//---------------------
function lineDelete( )
{
	var delCnt = 0; //削除行数カウンター
	multiple = 1; //得点加算時の倍数（通常：1 倍、Bonus：2 倍）

	//テトリミノが停止したキャンバスの４行チェック
	for(row=cY+3;row>=cY;row--)
	{
		var deletF = true; //各行ごとに判定
		var bonusCell = "NO"; //Bonus セルの有無

		//フィールド内 10 列をチェック
		for(col=2;col<12;col++)
		{
			//テトリミノ以外のセルがあれば
			if( canvas[row][col]%100 >= tetModel.length )
			{
				deletF = false;
				col = 12; //チェック強制終了
			}
			//Bonus セルの存在確認
			if( canvas[row][col] >= 100 ){ bonusCell = "YES"; }
		}
		if( deletF && bonusCell == "YES"){ multiple = 2; } //倍数を「２倍」
		//行削除
		if(deletF)
		{
      //削除行のマーキング
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(CELL*2, CELL*row, CELL*10, CELL);
			canvas.splice(row, 1);
			delCnt++; //削除行数 up
		}
	}

	//削除行数分の行要素挿入（空フィールド行）
	for(row=0;row<delCnt;row++)
	{
		//6:フィールド最上部, 0:挿入モード
		canvas.splice( 6, 0, fildLine.slice(0, fildLine.length) );
	}
  //NEXT 領域内に着地し、行削除した場合
  if( cY < 6 && delCnt > 0 )
  {
    //NEXT 領域の下の行から順に
    for(row=5;row>=cY;row--)
    {
      //NEXT 領域の 4 列
      for(col=5;col<=9;col++)
      {
        //テトリミノ表示セルなら
        if( canvas[row][col] < 7 )
        {
          //削除行数分下がった位置にセル値をコピー
          canvas[row+delCnt][col] = canvas[row][col];
          //移動前のセルを NEXT 領域色に
          canvas[row][col] = 9;
					}
        }
      }
    }
		return delCnt;
  }

//---------------------
// GAME OVER メッセージ
//---------------------
function gameOver( )
{
  //メッセージ表示矩形領域塗り潰し
  ctx.fillStyle = tetColor[8]; //背景色
  ctx.fillRect(CELL*3, CELL*10, CELL*8, CELL*3);
  //メッセージ表示
  ctx.fillStyle = "red";
  ctx.font = "30px 'ＭＳ ゴシック'";
  ctx.fillText("GAME OVER", CELL*7, CELL*12);
	ctx.font = "20px 'ＭＳ ゴシック'";
}
//------------------
// デバッグ
//------------------
function arydeb()
{
	for(var i=2;i<26;i++)
	{
		var text = "";
		for(var j=2;j<12;j++)
		{
			if(canvas[i][j]==8 || canvas[i][j]==9 || canvas[i][j]==10){ text += ' ,' }
			else{ text += (' '+canvas[i][j]).slice(-3) + ","; }
		}
		console.log(text);
	}
}
