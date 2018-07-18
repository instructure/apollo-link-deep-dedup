pipeline {
    agent {
        docker {
            image 'node:8-alpine'
        }
    }
    stages {
        stage('Checkout'){
            steps {
                echo 'Checking out commit....'
                slackSend (
                    channel: '#new_jenkins_noisy',
                    color: 'good',
                    message: "STARTED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})",
                    teamDomain: 'beedemo',
                    token: 'token'
                )
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Building....'
                sh 'npm install && npm run bootstrap && npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint'
                echo 'Testing...'
                sh 'npm run start & npm run test'
            }
        }
    }
}
