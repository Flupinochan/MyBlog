import React from "react";

import AppleBillComIcon from "./appleComBill.png";

const Blog20240330: React.FC = () => {
  return (
    <div id="blog0330">
      <h2>ブログ初投稿(≧∇≦*)</h2>
      <div className="blogContentBackColor">
        <div className="blogDay">
          <img src="/images/dayIcon.png" alt="dayIcon" className="dayIcon" />
          <span className="blogyyyymmdd">2024-03-30</span>
        </div>
        <h3>はじめに</h3>
        <p>こんにちは、MetalMentalです (*ﾟ▽ﾟ)ﾉ</p>
        <p>
          ブログを投稿するのは、1年ぶりになります
          <br />
          昨年度は、<b>「WordPressを使用したブログ」</b>
          を投稿していましたが、飽きて投稿しなくなってしまいました…
        </p>
        <p>
          そのため、今後は<b>「HTMLやTypeScriptを使用したブログ」</b>
          にチャレンジしていきたいと思います!!
        </p>
        <h3>本題</h3>
        <h4>本ブログについて</h4>
        <p>
          本ブログは、エンジニアが投稿するブログです
          <br />
          <b>AWS、生成AI、ブロックチェーン</b>
          に関する記事をメインにしたいと考えています
        </p>
        <p>
          勉強・検証する上で作成したコードは、
          <a
            href="https://github.com/Flupinochan"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          にアップロードします!!
          <br />
          みなさんのお役に立てれば幸いです (o_ _)o
        </p>
        <p>
          もちろん、本ブログに関するコードもGitHubにアップロードしています!!
          <br />
          興味がある方は、以下をご覧ください
        </p>
        <p>
          <a
            href="https://github.com/Flupinochan/MyBlog"
            target="_blank"
            rel="noopener noreferrer"
          >
            MyBlog
          </a>
        </p>
        <h4>生成AIを勉強する理由</h4>
        <p>
          シンプルに、便利で感銘を受けたからですw
          <br />
          現在は、個人レベルでしか利用されていませんが、当然、今後は企業レベルで利用されます
          <br />
          今のうちに、勉強しておこうと思いました
        </p>
        <p>
          本ブログでは、<b>RAG(Retrieval-Augmented Generation)</b>
          を導入予定ですので、楽しみにしていてください!!
        </p>
        <p>お金がかかりそうで怖いですが… ((((；ﾟДﾟ))))</p>
        <h4>ブロックチェーンを勉強する理由</h4>
        <p>
          先日、仮想通貨1ビットコインが、1000万円を超えました
          <br />
          さすがにもう仮想通貨を軽視することはできないです
          <br />
          金融の非中央集権化・民主化が来ると思います
        </p>
        <p>
          少しでもブロックチェーンを勉強し、金融関係の仕事に携わることで、食いっぱぐれないようにしたいです
          (｡-∀-)
        </p>
        <h3>おわりに</h3>
        <p>
          少し前に、自分のクレジットカードが不正利用されました Σ( ºωº )<br />
          以下のように、APPLE COM
          BILLというご利用名で、いくつも請求されていました
          <br />
          サポートが返金手続き中ですが、拒否されることもあるみたいで、怖いです
        </p>
        <p>
          心当たりが…あるんですよねぇw
          <br />
          先日、中華サイトで、原神の
          <a
            href="https://ascii.jp/elem/000/004/188/4188575/"
            target="_blank"
            rel="noopener noreferrer"
          >
            コラボスマホ(刻晴)
          </a>
          を購入しようとしました
          <br />
          思いとどまって、購入確認画面で戻ったのですが、手遅れだったのかもしれません…
        </p>
        <p>
          今度から、おとなしくメルカリで購入しようと思います
          <br />
          そんなに高くないですし…
        </p>
        <p>みなさんもお気を付けください</p>
        <img
          src={AppleBillComIcon}
          alt="appleComBill"
          className="normalImage"
        />
        <p>
          今回のブログは、ここでおしまいです
          <br />
          ご覧いただき、ありがとうございました ((*_ _))
        </p>
      </div>
    </div>
  );
};

export default Blog20240330;
