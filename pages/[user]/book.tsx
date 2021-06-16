import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ClockIcon, CalendarIcon, LocationMarkerIcon } from '@heroicons/react/solid';
import prisma from '../../lib/prisma';
import {collectPageParameters, telemetryEventTypes, useTelemetry} from "../../lib/telemetry";
import { useEffect, useState } from "react";
import dayjs from 'dayjs';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { LocationType } from '../../lib/location';
import Avatar from '../../components/Avatar';

export default function Book(props) {
    const router = useRouter();
    const { date, user } = router.query;

    const locations = props.eventType.locations || [];

    const [ selectedLocation, setSelectedLocation ] = useState<LocationType>(locations.length === 1 ? locations[0].type : '');
    const telemetry = useTelemetry();
    useEffect(() => {
        telemetry.withJitsu(jitsu => jitsu.track(telemetryEventTypes.timeSelected, collectPageParameters()));
    });

    const locationInfo = (type: LocationType) => locations.find(
        (location) => location.type === type
    );

    // TODO: Move to translations
    const locationLabels = {
        [LocationType.InPerson]: 'In-person meeting',
        [LocationType.Phone]: 'Phone call',
    };

    const bookingHandler = event => {
        event.preventDefault();

        let payload = {
            start: dayjs(date).format(),
            end: dayjs(date).add(props.eventType.length, 'minute').format(),
            name: event.target.name.value,
            email: event.target.email.value,
            notes: event.target.notes.value
        };

        if (selectedLocation) {
            payload['location'] = selectedLocation === LocationType.Phone ? event.target.phone.value : locationInfo(selectedLocation).address;
        }

        telemetry.withJitsu(jitsu => jitsu.track(telemetryEventTypes.bookingConfirmed, collectPageParameters()));
        const res = fetch(
            '/api/book/' + user,
            {
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            }
        );

        let successUrl = `/success?date=${date}&type=${props.eventType.id}&user=${props.user.username}`;
        if (payload['location']) {
            successUrl += "&location=" + encodeURIComponent(payload['location']);
        }

        router.push(successUrl);
    }

    return (
        <div>
            <Head>
                <title>Confirm your {props.eventType.title} with {props.user.name || props.user.username} | Calendso</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="max-w-3xl mx-auto my-24">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="sm:flex px-4 py-5 sm:p-6">
                        <div className="sm:w-1/2 sm:border-r">
                            <Avatar user={props.user} className="w-16 h-16 rounded-full mb-4" />
                            <h2 className="font-medium text-gray-500">{props.user.name}</h2>
                            <h1 className="text-3xl font-semibold text-gray-800 mb-4">{props.eventType.title}</h1>
                            <p className="text-gray-500 mb-2">
                                <ClockIcon className="inline-block w-4 h-4 mr-1 -mt-1" />
                                {props.eventType.length} minutes
                            </p>
                            {selectedLocation === LocationType.InPerson && <p className="text-gray-500 mb-2">
                                <LocationMarkerIcon className="inline-block w-4 h-4 mr-1 -mt-1" />
                                {locationInfo(selectedLocation).address}
                            </p>}
                            <p className="text-blue-600 mb-4">
                                <CalendarIcon className="inline-block w-4 h-4 mr-1 -mt-1" />
                                {dayjs(date).format("hh:mma, dddd DD MMMM YYYY")}
                            </p>
                            <p className="text-gray-600">{props.eventType.description}</p>
                        </div>
                        <div className="sm:w-1/2 pl-8 pr-4">
                            <form onSubmit={bookingHandler}>
                                <div className="mb-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your name</label>
                                    <div className="mt-1">
                                        <input type="text" name="name" id="name" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="John Doe" />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                    <div className="mt-1">
                                        <input type="email" name="email" id="email" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="you@example.com" />
                                    </div>
                                </div>
                                {locations.length > 1 && (
                                    <div className="mb-4">
                                        <span className="block text-sm font-medium text-gray-700">Location</span>
                                        {locations.map( (location) => (
                                            <label key={location.type} className="block">
                                                <input type="radio" required onChange={(e) => setSelectedLocation(e.target.value)} className="location" name="location" value={location.type} checked={selectedLocation === location.type} />
                                                <span className="text-sm ml-2">{locationLabels[location.type]}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {selectedLocation === LocationType.Phone && (<div className="mb-4">
                                   <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                   <div className="mt-1">
                                       <PhoneInput name="phone" placeholder="Enter phone number" id="phone" required className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" onChange={() => {}} />
                                   </div>
                                </div>)}
                                <div className="mb-4">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Additional notes</label>
                                    <textarea name="notes" id="notes" rows={3}  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="Please share anything that will help prepare for our meeting."></textarea>
                                </div>
                                <div>
                                    <button type="submit" className="btn btn-primary">Confirm</button>
                                    <Link href={"/" + props.user.username + "/" + props.eventType.slug}>
                                        <a className="ml-2 btn btn-white">Cancel</a>
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export async function getServerSideProps(context) {
    const user = await prisma.user.findFirst({
        where: {
          username: context.query.user,
        },
        select: {
            username: true,
            name: true,
            email:true,
            bio: true,
            avatar: true,
            eventTypes: true
        }
    });

    const eventType = await prisma.eventType.findUnique({
        where: {
          id: parseInt(context.query.type),
        },
        select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            length: true,
            locations: true,
        }
    });

    return {
        props: {
            user,
            eventType
        },
    }
}