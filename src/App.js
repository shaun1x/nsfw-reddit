import React, { Component } from "react";
import "./App.css";

if (process.env.NODE_ENV === "production") {
  console.log = () => {};
}

const Swiper = require("../node_modules/swiper/dist/js/swiper");

const Slide = ({ gfyKey, viewingIndex, videoIndex, redditSource }) => {
  viewingIndex === videoIndex && console.log("gfykey", gfyKey, redditSource);
  return (
    <div className="swiper-slide">
      <div>
        <a
          className="onscreen top-right"
          href={redditSource}
          rel="noopener noreferrer"
          target="_blank"
        >
          Reddit Source
        </a>

        <div className="onscreen bottom-left">
          Swipe Up{" "}
          <img
            height="10px"
            //@ts-ignore
            src={require("./up-arrow.svg")}
            alt="up"
          />
          <br />
        </div>
      </div>
      {viewingIndex === videoIndex && (
        <video
          autoPlay={true}
          playsInline={true}
          muted={true}
          width="100%"
          loop={true}
          // src={`https://giant.gfycat.com/ZanyTemptingAnemoneshrimp.webm`}
          // src={`https://thumbs.gfycat.com/${gfyKey}-mobile.mp4`}
          controls
        >
          <source src={`https://giant.gfycat.com/${gfyKey}.webm`} />
          <source src={`https://fat.gfycat.com/${gfyKey}.webm`} />
        </video>
      )}
    </div>
  );
};

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      slides: [],
      viewingIndex: 0,
      subreddits: [
        "NSFW_GIF",
        "NSFW_HTML5",
        "60fpsporn",
        "GirlsFinishingTheJob",
        "JerkingHimOntoHer",
        "SuckingItDry",
        "cumontongue",
        "cumcoveredfucking",
        "bodyshots"
      ]
    };
  }

  componentDidMount() {
    // this.loadVideos();

    document.addEventListener("keydown", this._handleKeyDown);
  }

  init = subreddit => () => {
    console.log("INIT");
    this.setState(
      {
        isLoading: true
      },
      () => {
        this.loadVideos(subreddit);
      }
    );
  };

  loadVideos = async subreddit => {
    this.setState({
      loadingText: "Loading..."
    });

    const r = await fetch(`https://www.reddit.com/r/${subreddit}.json`);

    const json = await r.json();

    const slides = this.getSlides(json);

    if (slides.length === 0) {
      alert("Oops, No compatible sources found... Redirecting to Reddit.com");
      window.location.href = "https://reddit.com/r/gifs";
    }

    console.log("INIT GOT SLIDES", slides.length);

    this.setState(
      {
        init: true,
        after: json.data.after,
        slides: slides
      },
      () => {
        this.swiper = new Swiper(".swiper-container", {
          direction: "vertical",
          pagination: {
            el: ".swiper-pagination",
            clickable: true
          }
        });

        // console.log("init view index", this.swiper.activeIndex);

        this.swiper.on("slideChange", () => {
          console.log("slide changed");
          this.setState({
            viewingIndex: this.swiper.activeIndex
          });
          this.loadMoreIfNecessary();
        });
      }
    );
  };

  _handleKeyDown = event => {
    switch (event.keyCode) {
      case 40:
        this.scrollToNext();
        break;
      case 38:
        this.scrollToPrev();
        break;
      default:
        break;
    }
  };

  scrollToNext = () => {
    if (this.swiper) {
      console.log("slide next");
      this.swiper.slideNext();
    }
  };

  scrollToPrev = () => {
    if (this.swiper) {
      console.log("slide next");
      this.swiper.slidePrev();
    }
  };

  loadMoreIfNecessary = async () => {
    console.log(
      "GET NEXT?",
      this.state.slides.length - 4,
      this.state.viewingIndex
    );

    if (this.state.slides.length - 4 === this.state.viewingIndex) {
      const r = await fetch(
        `https://www.reddit.com/r/NSFW_GIF.json?count=10&after=${
          this.state.after
        }`
      );
      const json = await r.json();

      const slides = this.getSlides(json);

      console.log("GOT NEXT", slides.length, slides);

      const HTMLSlides = slides.map((e, i) => (
        <Slide
          redditSource={e.redditSource}
          videoIndex={i}
          viewingIndex={this.state.viewingIndex}
          key={e.gfyKey}
          gfyKey={e.gfyKey}
        />
      ));

      console.log(HTMLSlides);

      // this.swiper.appendSlide(HTMLSlides);

      this.setState(
        {
          slides: [...this.state.slides, ...slides],
          after: json.data.after
        },
        () => {
          this.swiper.update();
        }
      );

      console.log("updates slides to", this.state.slides.length);
    }
  };

  getSlides = json => {
    return json.data.children
      .filter(c => c.data.domain === "gfycat.com")
      .map(c => {
        if (c.data.secure_media) {
          const url = c.data.secure_media.oembed.thumbnail_url;
          const m = url.match(/.com\/(.*)-size_restricted.gif/);
          // console.log(m[1]);
          if (m && m[1]) {
            return {
              gfyKey: m[1],
              redditSource: `https://reddit.com${c.data.permalink}`
            };
          }
        } else if (c.data.crosspost_parent_list) {
          const url =
            c.data.crosspost_parent_list[0].secure_media.oembed.thumbnail_url;
          const m = url.match(/.com\/(.*)-size_restricted.gif/);
          // const m = url.match(/.com\/(.*)/);
          // console.log("crosspost_parent_list", m[1]);

          if (m && m[1]) {
            return {
              gfyKey: m[1],
              redditSource: `https://reddit.com${c.data.permalink}`
            };
          }
        }
      })
      .filter(c => c);
  };
  render() {
    return (
      <React.Fragment>
        {this.state.init ? (
          <div className="swiper-container">
            <div className="swiper-wrapper">
              {this.state.slides.map((e, i) => (
                <Slide
                  redditSource={e.redditSource}
                  videoIndex={i}
                  viewingIndex={this.state.viewingIndex}
                  key={e.gfyKey}
                  gfyKey={e.gfyKey}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="sub-lists">
            {this.state.isLoading && this.state.loadingText}
            {!this.state.isLoading && (
              <React.Fragment>
                {this.state.subreddits.map((sr, idx) => {
                  let style = {
                    backgroundColor:
                      "#" + Math.floor(Math.random() * 16777215).toString(16)
                  };
                  return (
                    <div className="sub-block" style={style}>
                      <button
                        disabled={this.state.isLoading}
                        className="link"
                        onClick={this.init(sr)}
                      >
                        {sr}
                      </button>
                    </div>
                  );
                })}
              </React.Fragment>
            )}
          </div>
        )}
      </React.Fragment>
    );
  }
}
