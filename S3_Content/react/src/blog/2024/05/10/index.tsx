import React from "react";
import { useLocation } from "react-router-dom";

import CloudWatchMenu from "./cloudwatch_menu.png";
import CloudWatchRAM from "./cloudwatch_ram.png";
import CloudWatchRAMSetting from "./cloudwatch_ram_setting.png";
import CloudWatchRAMCode from "./cloudwatch_ram_code.png";
import CloudWatchRAMRoute from "./cloudwatch_ram_route.png";
import CloudWatchRAMComponent from "./cloudwatch_ram_component.png";
import CloudWatchRAMPage1 from "./cloudwatch_ram_page1.png";
import CloudWatchRAMPage2 from "./cloudwatch_ram_page2.png";
import CloudWatchRAMf12 from "./cloudwatch_ram_f12.png";
import { getRum } from "../../../../CloudWatchRUM";
import "./index.css";

const Blog20240510: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    const cwr = getRum();
    if (!cwr) return;
    console.log("logging pageview to cwr: " + location.pathname);
    cwr.recordPageView(location.pathname);
  }, [location]);
  return (
    <div id="blog0510">
      <h2>AWS CloudWatch RUMによるユーザ視点からの監視 (*╹▽╹*)</h2>
      <div className="blogContentBackColor">
        <div className="blogDay">
          <img src="/images/dayIcon.png" alt="dayIcon" className="dayIcon" />
          <span className="blogyyyymmdd">2024-05-10</span>
        </div>
        <h3>はじめに</h3>
        <p>こんにちは、MetalMentalです (*ﾟ▽ﾟ)ﾉ</p>
        <p>
          少し前に、AWSアカウントで、<b>Developerサポートプラン</b>を購入してみました
        </p>
        <p>$29しますが、AWSのエキスパートに質問し放題なので、むしろ安すぎるくらいだと思いました</p>
        <p>
          好きなAWSサービスは何ですか? と質問されたら、<b>AWSサポート!</b> と答えるかもしれませんw
        </p>
        <br />
        <p>以下は、CloudWatchのメニューバーです</p>
        <img className="normalImage CloudWatchMenu" src={CloudWatchMenu} alt="CloudWatchMenu" />
        <p>CloudWatchは、誰でも知っている有名なサービスですが、全機能を熟知している方は、少ないのではないでしょうか?</p>
        <p>
          気づいたら<b>X-Ray</b>が組み込まれていて、<b>Application Signals</b>という新機能も追加されています…
        </p>
        <p>
          どうやらCloudWatchを、<b>Datadog</b>のようなツールに近づけているみたいです
        </p>
        <p>
          具体的には、<b>Observability(Logs、Metrics、Traces)</b>に加え、<b>Application Signals</b>をプレリリース中です
        </p>
        <p>
          今回は、その新機能の1つである<b>CloudWatch RUM(Real User Monitoring)</b>について、解説いたします (　-`ω-)
        </p>
        <h3>本題</h3>
        <h4>CloudWatch RUM(Real User Monitoring)とは</h4>
        <p>実際にWebページを訪れたユーザに、Webページにアクセスした際のパフォーマンス情報やエラーログをCloudWatchに送信させる機能です</p>
        <img className="normalImage CloudWatchRAM" src={CloudWatchRAM} alt="CloudWatchRAM" />
        <p>訪れたWebページ(Reactの場合はRoute)や、ロード時間、エラー情報などが確認できます!</p>
        <h4>実装方法</h4>
        <p>仕組みはシンプルで、以下2手順になります</p>
        <p>コードのサンプルは、CloudWatch RUMコンソール画面で設定完了時に表示されます</p>
        <ol>
          <li>CloudWatch RUM コンソール画面で送信先となるエンドポイントを設定</li>
          <li>Webページ(HTML、JavaScript)に、エンドポイントにデータを送信するためのコードを記載</li>
        </ol>
        <p>1. に関しては、難しい設定はありません</p>
        <p>コンソールの設定画面に従うだけで良いです</p>
        <p>
          ポイントとしては、以下の画像のように、送信元のWebページのドメインを設定するのですが、テストなどでローカルのサーバを利用している時は、<b>localhost</b>にするとローカルからのデータも受け取れるようになるので覚えておくとよいです
        </p>
        <p>テストが終わった後で、本番用のドメインに変更してください</p>
        <img className="normalImage CloudWatchRAMSetting" src={CloudWatchRAMSetting} alt="CloudWatchRAMSetting" />
        <p>2. に関しては、コードを記載する必要があります</p>
        <p>しかし、以下のようにサンプルがあるので、コピペするだけでも設定は可能です</p>
        <img className="normalImage CloudWatchRAMCode" src={CloudWatchRAMCode} alt="CloudWatchRAMCode" />
        <p>
          また、<b>npm install aws-rum-web</b>でインストールする方法もありますが、
          <a href="https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          にもあるとおり、CDNを利用して、HTMLにスクリプトを埋め込む設定も可能です
        </p>
        <p>ここでは、TypeScript ReactのWebページに設定する方法を解説いたします</p>
        <p>前提として、以下のようなRoute(Webページ)があります</p>
        <img className="normalImage CloudWatchRAMRoute" src={CloudWatchRAMRoute} alt="CloudWatchRoute" />
        <p>以下のように、RUM設定用のファイルを作成します</p>
        <p>サンプルコードをコピペし、24行目のようにexportします</p>
        <img className="normalImage CloudWatchRAMComponent" src={CloudWatchRAMComponent} alt="CloudWatchComponent" />
        <p>データを送信したいWebページで、以下のようにuseEffectとrecordPageViewを使用して、Webページがレンダリングされた際に、データを送信するようにします</p>
        <p>useLocationを使用して、React Route情報を送信していることが分かりますね!</p>
        <p>
          <a href="https://aws.amazon.com/jp/blogs/mt/using-amazon-cloudwatch-rum-with-a-react-web-application-in-five-steps/" target="_blank" rel="noopener noreferrer">
            ※参考 AWS Blog
          </a>
        </p>
        <img className="normalImage CloudWatchRAMPage1" src={CloudWatchRAMPage1} alt="CloudWatchPage1" />
        <p>以下のように、本ブログのページも設定しています</p>
        <img className="normalImage CloudWatchRAMPage2" src={CloudWatchRAMPage2} alt="CloudWatchPage2" />
        <p>Webページを訪れて、f12キーを押し、以下のようにPOSTでデータが送信されていれば設定完了です(v´∀`*)</p>
        <img className="normalImage CloudWatchRAMf12" src={CloudWatchRAMf12} alt="CloudWatchf12" />
        <h3>終わりに</h3>
        <p>GWは、X-RayやGrafanaについても学びました</p>
        <p>Observabilityについての知見を深めたかったからです</p>
        <p>Observerになれるよう頑張ります ( ㅍ_ㅍ)</p>
        <p>
          今回のブログは、ここでおしまいです
          <br />
          ご覧いただき、ありがとうございました ((*_ _))
        </p>
      </div>
    </div>
  );
};

export default Blog20240510;
