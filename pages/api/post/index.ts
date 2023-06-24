import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { options } from '../auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
export default async function handle(req: NextApiRequest, res: NextApiResponse) {

    const { method } = req;

    switch (method) {
        case 'POST':
            const { title, content } = req.body;
            const session = await getServerSession(req, res, options)
            const email = session?.user?.email; // Retrieve the user's email from the session

            try {
                if (!email) {
                    res.status(401).json({ error: 'User email not found in session.' });
                    return;
                }

                const user = await prisma.user.findUnique({
                    where: { email: email }, // Provide the email as the search criteria
                });

                if (!user) {
                    res.status(404).json({ error: 'User not found.' });
                    return;
                }

                const result = await prisma.post.create({
                    data: {
                        title,
                        content,
                        author: {
                            connect: { id: user.id }, // Connect the post to the author using their ID
                        },
                    },
                });

                res.status(200).json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'An error occurred while creating the post.' });
            }
            break;
        default: /* Method not allowed */
            res.status(405).json({ success: false, message: 'Method not allowed' });
            break;
    }
}
