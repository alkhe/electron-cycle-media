import { ReplaySubject, Observable as $ } from 'rx';
import { h } from '@cycle/dom';

let toPlayerState = player => ({
	duration: player.duration,
	volume: player.volume * 100,
	position: player.currentTime,
	playbackRate: player.playbackRate,
	source: player.currentSrc,
	width: player.videoWidth,
	height: player.videoHeight,
	isFinished: player.ended,
	isMuted: player.muted,
	isPlaying: !player.paused,
	isSeeking: player.seeking,
	isLooped: player.loop,
})

const MEDIA_EVENTS = $.from(['play', 'pause', 'volumechange', 'durationchange', 'loadstart', 'emptied', 'ratechange', 'waiting', 'timeupdate']);

const makePlayerEvent$ = player =>
	MEDIA_EVENTS
		.flatMap(event => $.fromEvent(player, event))
		.pluck('target');

const makeCommand$ = controls =>
	$.merge(...Object.keys(controls)
		.map(name =>
			controls[name].map(value => ({ name, value }))
	))

const driverDefaults = () => ({
	isPlaying: false,
	position: 0,
	duration: 0,
	volume: 100
});

const media = {
	play() { this.play(); },
	pause() { this.pause(); },
	load() { this.load(); },
	volume(v) { this.volume = v * .01; },
	position(p) { this.currentTime = p; },
	replay() { this.currentTime = 0; this.play(); }
}

class Hook {
	constructor(node$) {
		this.node$ = node$;
	}
	hook(node, tagname) {
		node._fqtn = tagname;
		this.node$.onNext(node);
	}
}

export default () =>
	source$ => {
		const node$ = new ReplaySubject();

		source$.forEach(([node, { name, value }]) => {
			if (name in media) {
				node::media[name](value);
			}
		});

		const createMediaHelper = mediaType => (tagName, properties, children) => {
			const fullyQualifiedTagName = mediaType.concat(tagName.replace(' ', ''));
			const filteredNode$ = node$.filter(node => node._fqtn === fullyQualifiedTagName);
			const state$ = filteredNode$.flatMapLatest(
					node => makePlayerEvent$(node).map(toPlayerState)
			).distinctUntilChanged().startWith(driverDefaults());

			return {
				node$: filteredNode$,
				vtree: h(fullyQualifiedTagName, Object.assign({}, { [fullyQualifiedTagName]: new Hook(node$) }, properties), children),
				state$: state$,
				controls: controls => $.combineLatest(filteredNode$, makeCommand$(controls))
			}
		};

		return {
			video: createMediaHelper('video'),
			audio: createMediaHelper('audio'),
			states$: players => $.combineLatest(players.map(player => player.state$)),
			controls: players => controls => {
				$.merge(players.map(player => $.combineLatest(player.node$, makeCommand$(controls))))
			}
		};
	}
