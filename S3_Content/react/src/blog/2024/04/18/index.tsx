import React from "react";

import "./index.css";
import Jpg1 from "./1.jpg";
import Jpg2 from "./2.jpg";
import Polyrepo from "./polyrepo.png";
import Monorepo from "./monorepo.png";
import Sample from "./sample.png";

const Blog20240418: React.FC = () => {
  return (
    <div id="blog0418">
      <h2>AWS CodeCommitのMonorepo構成 (｀･ω･´)</h2>
      <div className="blogContentBackColor">
        <div className="blogDay">
          <img src="/images/dayIcon.png" alt="dayIcon" className="dayIcon" />
          <span className="blogyyyymmdd">2024-04-18</span>
        </div>
        <h3>はじめに</h3>
        <p>こんにちは、MetalMentalです (*ﾟ▽ﾟ)ﾉ</p>
        <p>
          Monorepo構成のリポジトリについてお話する前に、本ブログが
          <b>「React」</b>を使用したブログになったことをご報告いたします!
        </p>
        <p>
          Reactは、<b>SPA(Single Page Application)</b>
          を作成するためのJavaScriptライブラリです
          <br />
          AngularやVueと比較されます
        </p>
        <p>
          SPAについて詳しくない方にご説明すると、以下の画像のように、リンク移動前と後で、
          <b>ページの一部しか再読み込みされない</b>ようになった、ということです!
        </p>
        <div className="image-container">
          <div className="img-box">
            <p>■リンク移動前</p>
            <img className="item" src={Jpg1} alt="jpg1" />
          </div>
          <div className="img-box">
            <p>■リンク移動後</p>
            <img className="item" src={Jpg2} alt="jpg2" />
          </div>
        </div>
        <p>
          タイトルの画像とメニューバーは再読み込みされず、本文のみが再読み込みされています!
        </p>
        <p>
          ユーザーは、ページ移動時のリロード時間が削減されるので、
          <b>ブラウザが軽くなります</b>
          <br />
          ブログを作成する私にとっても、ページごとにタイトルの画像やメニューバーを設定する必要がなくなり、
          <b>ブログの作成が楽になります</b>
        </p>
        <p>Win-Winですね (⁎˃ᴗ˂⁎)</p>
        <h3>本題</h3>
        <p>余談が長くなりましたが、本題に入ります</p>
        <h4>Monorepoとは</h4>
        <p>
          従来は、1つのプロジェクトにつき、1つのリポジトリを作成していました
          <br />
          そして、1つのリポジトリに対して、1つのCI/CDを設定します
          <br />⇒ <b>Polyrepo</b> と言うみたいです
        </p>
        <p>
          これに対して、1つのリポジトリに対して、複数のCI/CDを設定するのが
          <b>「Monorepo」</b>です
          <br />
          ※ちょっと御幣があるかもしれませんが…
        </p>
        <div className="image-container">
          <div className="img-box">
            <p>■Polyrepo</p>
            <img className="item" src={Polyrepo} alt="polyrepo" />
          </div>
          <div className="img-box">
            <p>■Monorepo</p>
            <img className="item" src={Monorepo} alt="monorepo" />
          </div>
        </div>
        <p>
          具体的には、リポジトリ内に作成した任意のディレクトリやファイルに対して、CI/CDを設定するのですが、AWS
          CodeCommitでは簡単にはできません
        </p>
        <p>
          なぜなら、CodeCommitやCodePipelineの機能で、ディレクトリやファイルレベルの変更を検知できないからです
        </p>
        <h4>CodeCommitでMonorepoを実装する方法</h4>
        <p>
          先ほどもお伝えしたとおり、2024/04/18では、CodeCommitの機能にMonorepo機能はありません
          <br />
          そのため、Lambdaを使用して、コードで上手く処理するしかないです…
        </p>
        <p>
          ですが、難しくはないです
          <br />
          コード量は、100行にも満たないです
        </p>
        <p>
          コードは、
          <a
            href="https://github.com/Flupinochan/Monorepo/blob/main/monorepo-project/lib/lambda-code/index.py"
            target="_blank"
            rel="noopener noreferrer"
          >
            こちら
          </a>{" "}
          を参考にしていただければ幸いです
        </p>
        <p>
          <b>
            1. EventBridgeで、CodeCommitのコミットを検知
            <br />
            2.
            Lambdaで、1つ前のコミットと現在のコミットを比較し、変更のあったディレクトリやファイルを取得
            <br />
            3.
            そのままLambdaで、2で取得したディレクトリやファイルに応じてCodePipelineを実行
          </b>
        </p>
        <p>というような感じになります!</p>
        <p>
          <a
            href="https://docs.aws.amazon.com/ja_jp/codecommit/latest/userguide/monitoring-events.html#referenceUpdated"
            target="_blank"
            rel="noopener noreferrer"
          >
            EventBridgeのコミットイベント
          </a>{" "}
          には、<b>oldCommitId</b>(1つ前のコミット) と <b>commitId</b>
          (現在のコミット) があります
        </p>
        <p>これをEventBridgeのトリガーで設定したLambdaで取得します</p>
        <p>
          それから、CodeCommitのAPI{" "}
          <a
            href="https://docs.aws.amazon.com/ja_jp/codecommit/latest/userguide/monitoring-events.html#referenceUpdated"
            target="_blank"
            rel="noopener noreferrer"
          >
            get_differences
          </a>{" "}
          を使用して、2つのコミットを比較し、変更のあったディレクトリやファイルのパスを取得します
        </p>
        <p>
          また、リクエストをする際に、変更を確認したいディレクトリを指定できます
          <br />
          そして、レスポンスがあるかないかで、そのディレクトリに変更があったのかを確認することができます
        </p>
        <p>
          最後に、取得したパスに応じて、if文で分岐させて、
          <a
            href="https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/codepipeline/client/start_pipeline_execution.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            CodePipeline
          </a>{" "}
          を実行して終わりです!
          <br />
          ※CodePipeline
          V2であれば、CodePipeline実行時に「variables」を使用することで、CodePipeline変数が設定できます
        </p>
        <p>
          以下が{" "}
          <a
            href="https://github.com/Flupinochan/Monorepo"
            target="_blank"
            rel="noopener noreferrer"
          >
            実装例
          </a>{" "}
          になります!
          <img className="normalImage" src={Sample} alt="sample" />
        </p>
        <h3>終わりに</h3>
        <p>以上、React(SPA)とMonorepoについてのお話でした!</p>
        <p>
          Monorepoは、知っておいて損はないと思います
          <br />
          わざわざリポジトリを作成するほどではないけれど、ディレクトリやファイル単位でCI/CDを設定したい!
          ということは、あり得ると思ったからです
        </p>
        <p>
          今回のブログは、ここでおしまいです
          <br />
          ご覧いただき、ありがとうございました ((*_ _))
        </p>
      </div>
    </div>
  );
};

export default Blog20240418;
