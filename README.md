# Audition Grabber

Chrome extention that adds a BroadwayWorld.com audition posting to a calendar, as a .ics file or a google calendar link.

Only works on BroadwayWorld.com right now, since Backstage has this built in. I might do Playbill later, if I have time.

Is it robust? haha. No. I'm just scraping BroadwayWorld by "strong" tags and regex because the site is an absolute mess. If they change formatting it's very possible this will break, and there will certainly be cases where it doesn't work right now. I've already had to account for some bonkers edge cases. Or just, not having an event end time.

All this to say, if there's anything not totally normal about the posting you should check that all the info is correct. If it's not, lmk (see below).

## Issues

If it's not working, you should get an error notice containing a link that will submit an issue on github.

Or it might "work" but get things wrong or fuck up somehow. If that's the case, submit an issue [here](https://github.com/acciojacob/audition_grabber/issues). Just say what's wrong and provide the listing url.

I'll try to fix things quickly but like, I do have a life. Well maybe not. I mean I did make this in the first place. Whatever.

## How To Use

You literally just click the extension icon.

You can also right click to go to the options page, which as of now lets you:

- choose to export to Google Calendar or download as a .ics file
- choose which sections you want to include in the event description

## Dependencies

The tool uses 2 libraries from the following projects:

- [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [Blob.js](https://github.com/eligrey/Blob.js)
- [ics.js](https://github.com/acciojacob/ics.js)
- [moment.js](https://github.com/moment/moment)
- [moment-timezone.js](https://github.com/moment/moment-timezone)

I've compressed and combined them.

## Credits

- [Jacob Rienstra](https://github.com/acciojacob): Me

Thank me on venmo.
