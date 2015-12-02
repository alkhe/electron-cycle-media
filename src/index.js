import { run } from '@cycle/core';
import { h, makeDOMDriver } from '@cycle/dom';
import { Observable as $ } from 'rx';
import makePlayerDriver from './mediadriver';
import mediatime from './mediatime';

const Event = event =>
	el => el.events(event);

const click = Event('click');
const mousemove = Event('mousemove');
const input = Event('input');

let intent = DOM => ({
	mouse: mousemove(DOM.select('.Player')),
	playToggle: click(DOM.select('.PlayToggle')),
	seek: input(DOM.select('.Seekbar')).map(e => e.target.value),
	volume: input(DOM.select('.Volume')).map(e => e.target.value)
})

let model = ({ mouse, playToggle, input, seek }, video) => ({
	showBar: $.merge(
		mouse.map(() => true),
		mouse.startWith(0).debounce(500).map(() => false)
	).startWith(true).distinctUntilChanged(),
	playing: playToggle.startWith(false).scan(x => !x),
	duration: video.state$.pluck('duration'),
	position: video.state$.pluck('position'),
	volume: video.state$.pluck('volume'),
	video
})

let view = ({ showBar, playing, duration, position, volume, video }) =>
	$.combineLatest(showBar, playing, duration, position, volume,
		(showBar, playing, duration, position, volume) =>
			h('.Player', [
				video.vtree,
				h(showBar ? 'div.controls' : 'div.controls.hidden', [
					h('i.PlayToggle.fa' + (playing ? '.fa-pause' : '.fa-play')),
					h('input.Seekbar', { type: 'range', min: 0, max: duration, value: position }),
					h('.Seektime', `${ mediatime(position | 0) } / ${ mediatime(duration | 0) }`),
					h('input.Volume', { type: 'range', min: 0, max: 100, value: volume }),
					h('i.VolumeIndicator.fa.fa-volume-' + (volume < 70 ? volume === 0 ? 'off' : 'down' : 'up'))
				])
			])
	);

run(({ DOM, Player }) => {
	let video = Player.video('#video', { src: './assets/wat.mp4' });
	let actions = intent(DOM);
	let data = model(actions, video);

	return {
		DOM: view(data),
		Player: video.controls({
			play: data.playing.filter(x => x),
			pause: data.playing.filter(x => !x),
			position: actions.seek,
			volume: actions.volume
		})
	};
}, {
	DOM: makeDOMDriver('#root'),
	Player: makePlayerDriver()
});
