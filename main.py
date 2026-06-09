# main.py

import threading

from stream.producer import producer
from detection.consumer import consumer


def main():

    producer_thread = threading.Thread(
        target=producer,
        daemon=True
    )

    consumer_thread = threading.Thread(
        target=consumer,
        daemon=True
    )

    producer_thread.start()
    consumer_thread.start()

    producer_thread.join()
    consumer_thread.join()


if __name__ == "__main__":
    main()